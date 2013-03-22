module.exports = function(Sequelize, DataTypes) {

  return Sequelize.define('question', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    question: { type: DataTypes.STRING },
    answers: { type: DataTypes.STRING },
    created_by: { type: DataTypes.INTEGER }
  }, {
    underscored: true,
    paranoid: true,
    instanceMethods: {
      answers: function() {
        return this.answers.split(',');
      },
      render: function() {

        return Sequelize._renderQuestion({
          id: this.id,
          question: this.question,
          answers: this.answers.split(','),
          created_by: this.created_by,
          answerable: true
        });

      }
    }
  });

};