module.exports = function(Sequelize, DataTypes) {

  return Sequelize.define('gauge_question_map', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    gauge_id: { type: DataTypes.INTEGER },
    question_id: { type: DataTypes.STRING },
    scoring: { type: DataTypes.STRING }
  }, {
    underscored: true,
    paranoid: true
  });

};