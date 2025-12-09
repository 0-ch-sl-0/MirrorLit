module.exports = (sequelize, Sequelize) => {
  const articleImage = sequelize.define("articleImage", {
    image_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    image_url: {
      type: Sequelize.STRING(512),
      allowNull: false
    },
    article_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: "articles",
        key: "article_id"
      },
      onDelete: "CASCADE"
    }
  },
    {
      timestamps: false,
      tableName: "article_images"
    });
  return articleImage;
}
// [Review]
//  현재 article_id는 unique: true가 설정되어 있어,
// 하나의 기사당 하나의 이미지만 저장 가능한 구조.
// 다중 이미지 업로드 기능이 추가될 가능성을 고려한다면
// unique 제약을 제거하고 1:N 관계로 확장하는 구조가 고려될 만함.
