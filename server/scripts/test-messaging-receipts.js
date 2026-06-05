/* Synthetic test for messaging delivery receipts + reactions. Creates two temp
 * users + a direct conversation, exercises markDelivered / toggleReaction /
 * markConversationRead, and cleans up. Run: node scripts/test-messaging-receipts.js */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { models, sequelize } = require('../src/db');
const { Op } = require('sequelize');
const messaging = require('../src/services/messagingService');

const TAG = `msgtest_${Date.now()}_`;
const e = (s) => (TAG + s + '@x.io').toLowerCase();
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ✓', m); } else { fail++; console.log('  ✗', m); } };
const created = { users: [], conversations: [], messages: [] };

async function mkUser(first, role) {
  const u = await models.User.create({
    email: e(first), passwordHash: 'x', role,
    firstName: first, lastName: 'T', emailVerified: true, status: 'active'
  });
  created.users.push(u.id);
  return u;
}

(async () => {
  try {
    const alice = await mkUser('alice', 'mentor');
    const bob = await mkUser('bob', 'mentee');

    // Direct conversation (admin-style: bypasses recipient allow-list since alice is mentor)
    const convo = await messaging.createOrGetDirectConversation(alice.id, bob.id);
    created.conversations.push(convo.id);
    ok(!!convo?.id, 'direct conversation created');

    // Alice sends a message to Bob. Bob is offline → deliveredAt stays null.
    const sent = await messaging.sendMessage(alice.id, { conversationId: convo.id, messageText: 'hello bob' });
    created.messages.push(sent.message.id);
    ok(sent.message.deliveredAt == null, 'message starts undelivered (recipient offline)');

    // Bob comes online → markDelivered flips it and reports back to the sender.
    const delivered = await messaging.markDelivered(bob.id);
    ok(delivered.some((d) => d.id === sent.message.id && d.senderId === alice.id), 'markDelivered returns message for sender');
    const reloaded = await models.Message.findByPk(sent.message.id);
    ok(reloaded.deliveredAt != null, 'deliveredAt persisted after markDelivered');

    // Calling again is a no-op (nothing pending).
    const deliveredAgain = await messaging.markDelivered(bob.id);
    ok(deliveredAgain.length === 0, 'markDelivered is idempotent');

    // Bob reads the conversation.
    const read = await messaging.markConversationRead(bob.id, convo.id);
    ok(read.updatedCount >= 1, 'markConversationRead updates count');
    const afterRead = await models.Message.findByPk(sent.message.id);
    ok(afterRead.isRead === true && afterRead.readAt != null, 'message marked read');

    // Reactions: add → replace → toggle-off.
    let r = await messaging.toggleReaction(bob.id, sent.message.id, '\u{1F44D}');
    ok(r.reactions.length === 1 && r.reactions[0].emoji === '\u{1F44D}', 'reaction added');

    r = await messaging.toggleReaction(bob.id, sent.message.id, '❤️');
    ok(r.reactions.length === 1 && r.reactions[0].emoji === '❤️', 'different emoji replaces (one per user)');

    r = await messaging.toggleReaction(bob.id, sent.message.id, '❤️');
    ok(r.reactions.length === 0, 'same emoji toggles reaction off');

    // Two users can each react.
    await messaging.toggleReaction(bob.id, sent.message.id, '\u{1F389}');
    r = await messaging.toggleReaction(alice.id, sent.message.id, '\u{1F389}');
    ok(r.reactions.length === 2, 'multiple users can react to the same message');

    // listMessages includes reactions.
    const list = await messaging.listMessages(bob.id, convo.id, { limit: 50 });
    const target = list.find((m) => m.id === sent.message.id);
    ok(Array.isArray(target?.reactions) && target.reactions.length === 2, 'listMessages includes reactions');

    // Non-participant cannot react.
    const carol = await mkUser('carol', 'mentee');
    let blocked = false;
    try { await messaging.toggleReaction(carol.id, sent.message.id, '\u{1F44D}'); }
    catch { blocked = true; }
    ok(blocked, 'non-participant cannot react');

  } catch (err) {
    fail++;
    console.error('  ✗ threw:', err.message);
    console.error(err.stack);
  } finally {
    // Cleanup
    try {
      if (created.messages.length) {
        await models.MessageReaction.destroy({ where: { messageId: { [Op.in]: created.messages } } });
      }
      if (created.conversations.length) {
        await models.Message.destroy({ where: { threadId: { [Op.in]: created.conversations } } });
        await models.ConversationParticipant.destroy({ where: { conversationId: { [Op.in]: created.conversations } } });
        await models.Conversation.destroy({ where: { id: { [Op.in]: created.conversations } } });
      }
      if (created.users.length) {
        await models.Notification.destroy({ where: { userId: { [Op.in]: created.users } } });
        await models.User.destroy({ where: { id: { [Op.in]: created.users } } });
      }
    } catch (cleanupErr) {
      console.error('  cleanup warning:', cleanupErr.message);
    }
    console.log(`\n${pass} passed, ${fail} failed`);
    await sequelize.close();
    process.exit(fail ? 1 : 0);
  }
})();
