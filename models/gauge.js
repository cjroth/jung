module.exports = function(Sequelize, DataTypes) {

  return Sequelize.define('gauge', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING },
    description:  { type: DataTypes.STRING },
    created_by: { type: DataTypes.INTEGER }
  }, {
    underscored: true,
    paranoid: true
  });

};