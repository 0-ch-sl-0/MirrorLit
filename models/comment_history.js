module.exports = (sequelize, Sequelize) => {
  const CommentHistory = sequelize.define('comment_history', {
    article_id: {
      type: Sequelize.INTEGER,
      references: {
        model: "articles",
        key: "article_id"
      },
      allowNull: false,
      primaryKey: true
    },

    comment_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "comments",
        key: "comment_id"
      },
      onDelete: "CASCADE",
      primaryKey: true
    },

    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "user_id"
      },
      onDelete: "CASCADE",
      primaryKey: true
    }
  },
    {
      timestamps: false,
      tableName: 'comment_history'
    });

  return CommentHistory;
};
