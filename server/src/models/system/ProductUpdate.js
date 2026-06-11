module.exports = (sequelize, DataTypes) => {
  const ProductUpdate = sequelize.define('ProductUpdate', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    // Human-written note (rich HTML from the editor). Rendered with prose styles.
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'feature',
      validate: { isIn: [['feature', 'improvement', 'fix']] }
    },
    // Role views this entry is shown to.
    audience: {
      type: DataTypes.ARRAY(DataTypes.STRING(20)),
      allowNull: false,
      defaultValue: ['admin', 'mentor', 'mentee']
    },
    // Major entries trigger the one-time "What's New" modal on next visit.
    isMajor: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_major'
    },
    actionUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'action_url'
    },
    actionLabel: {
      type: DataTypes.STRING(80),
      allowNull: true,
      field: 'action_label'
    },
    // NULL = draft. The user-facing feed only returns published entries.
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'published_at'
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'created_by'
    }
  }, {
    tableName: 'product_updates',
    underscored: true,
    timestamps: true
  });

  ProductUpdate.associate = (models) => {
    ProductUpdate.belongsTo(models.User, { foreignKey: 'created_by', as: 'author' });
  };

  return ProductUpdate;
};
