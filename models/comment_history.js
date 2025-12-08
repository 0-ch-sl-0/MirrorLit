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

// [REVIEW]
// 이전 버전의 comment_history는 (article_id, user_id)가 복합 PK로 설정되어있음.
// 한 사용자가 한 기사에 대해 여러 댓글을 작성하거나 수정할 경우,
// 새로운 이력이 INSERT되지 않고 기존 데이터가 덮어써질 가능성이 있어,
// comment_id를 복합 기본키에 추가함으로써 오류를 방지하였다,
// 그러나 한 사용자가 특정 기사에 하나의 댓글 알림 상태만 유지하는 형태가 되어,
// 구조적 한계가 보이므로, 확장성을 고려한다면,
// history_id같은 단일 기본키를 만들고, 기존 복합 기본키 속성들은 외래키로 두는 구조가 더 유용해 보임.
