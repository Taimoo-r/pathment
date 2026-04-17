module.exports = (sequelize, DataTypes) => {
  const RegistrationInvite = sequelize.define('RegistrationInvite', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    tokenHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'token_hash'
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['mentor', 'mentee']]
      }
    },
    invitedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'invited_by'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at'
    },
    usedAt: {
      type: DataTypes.DATE,
      field: 'used_at'
    },
    usedBy: {
      type: DataTypes.UUID,
      field: 'used_by'
    },
    revokedAt: {
      type: DataTypes.DATE,
      field: 'revoked_at'
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {}
    }
  }, {
    tableName: 'registration_invites',
    underscored: true,
    indexes: [
      { fields: ['token_hash'] },
      { fields: ['email'] },
      { fields: ['role'] },
      { fields: ['invited_by'] },
      { fields: ['expires_at'] },
      { fields: ['used_at'] },
      { fields: ['revoked_at'] }
    ]
  });

  RegistrationInvite.associate = (models) => {
    RegistrationInvite.belongsTo(models.User, {
      foreignKey: 'invited_by',
      as: 'inviter',
      onDelete: 'CASCADE'
    });
    RegistrationInvite.belongsTo(models.User, {
      foreignKey: 'used_by',
      as: 'usedByUser',
      onDelete: 'SET NULL'
    });
  };

  return RegistrationInvite;
};