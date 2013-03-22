module.exports = function(Sequelize, DataTypes) {

  return Sequelize.define('answer', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    question_id: { type: DataTypes.INTEGER },
    answer: { type: DataTypes.STRING },
    answered_by: { type: DataTypes.INTEGER },
  }, {
    underscored: true
  });

};