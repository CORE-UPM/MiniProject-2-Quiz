'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
        'Quizzes',
        'attachmentId',
        {
          type: Sequelize.INTEGER,
          references: {
            model: "Attachments",
            key: "id"
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Quizzes', 'attachmentId');
  }
};
