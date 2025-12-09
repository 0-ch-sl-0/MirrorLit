module.exports = (sequelize, Sequelize) => {
  const CommentReaction = sequelize.define('comment_reaction', {
    reaction_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    reaction_type: {
      type: Sequelize.STRING(10),
      allowNull: false,
      validate: {
        isIn: [['like', 'dislike']]
      }
    },
    comment_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "comments",
        key: "comment_id",
        onDelete: "SET NULL"
      },
    },
    user_id: { 
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "user_id"
      },
      onDelete: "SET NULL"
    }
  }, {
    timestamps: false,
    tableName: 'comment_reaction'
  });

  return CommentReaction;
};

// [REVIEW]
// 현재 (comment_id, user_id)에 대한 UNIQUE 제약이 없음.
// 동시에 요청이 들어오는 경우, 한 사용자가 하나의 댓글에 중복 추천/비추천을 남길 수 있는 구조적 문제가 있음.
// 아래와 같은 복합 UNIQUE 인덱스를 추가하여 DB 차원에서 중복 리액션을 방지하는 것이 안전.
// indexes: [
//   {
//     unique: true,
//     fields: ['comment_id', 'user_id']
//   }
// ]
