module.exports = function(Sequelize, DataTypes) {

  return Sequelize.define('user', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING },
    password: { type: DataTypes.STRING },
    first_name:  { type: DataTypes.STRING },
    last_name: { type: DataTypes.STRING },
    session_id: { type: DataTypes.STRING }
  }, {
    underscored: true,
    paranoid: true
  });

};