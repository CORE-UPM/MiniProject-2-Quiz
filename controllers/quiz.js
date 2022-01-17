const Sequelize = require("sequelize");
const {models} = require("../models");


// GET /quizzes
exports.index = async (req, res, next) => {

    try {
        const quizzes = await models.Quiz.findAll();
        res.render('quizzes/index.ejs', {quizzes});
    } catch (error) {
        next(error);
    }
};


// GET /quizzes/:quizId
exports.show = async (req, res, next) => {

    try {
        const quizId = Number(req.params.quizId);

        const quiz = await models.Quiz.findByPk(quizId);
        if (!quiz) {
            throw new Error('There is no quiz with id=' + quizId);
        }

        res.render('quizzes/show', {quiz});
    } catch (error) {
        next(error);
    }
};


// GET /quizzes/new
exports.new = (req, res, next) => {

    const quiz = {
        question: "",
        answer: ""
    };

    res.render('quizzes/new', {quiz});
};

// POST /quizzes/create
exports.create = async (req, res, next) => {

    const {question, answer} = req.body;

    let quiz;
    try {
        quiz = models.Quiz.build({
            question,
            answer
        });

        // Saves only the fields question and answer into the DDBB
        quiz = await quiz.save({fields: ["question", "answer"]});
        res.redirect('/quizzes/' + quiz.id);
    } catch (error) {
        if (error instanceof (Sequelize.ValidationError)) {
            console.log('There are errors in the form:');
            error.errors.forEach(({message}) => console.log(message));
            res.render('quizzes/new', {quiz});
        } else {
            next(error);
        }
    }
};


// GET /quizzes/:quizId/edit
exports.edit = async (req, res, next) => {

    const quizId = Number(req.params.quizId);

    try {
        const quiz = await models.Quiz.findByPk(quizId);
        if (quiz) {
            res.render('quizzes/edit', {quiz});
        } else {
            throw new Error('There is no quiz with id=' + quizId);
        }
    } catch (error) {
        next(error);
    }
};


// PUT /quizzes/:quizId
exports.update = async (req, res, next) => {

    const quizId = Number(req.params.quizId);

    let quiz;
    try {
        quiz = await models.Quiz.findByPk(quizId);
        if (!quiz) {
            throw new Error('There is no quiz with id=' + quizId);
        }

        quiz.question = req.body.question;
        quiz.answer = req.body.answer;

        await quiz.save({fields: ["question", "answer"]});
        res.redirect('/quizzes/' + quiz.id);
    } catch (error) {
        if (error instanceof (Sequelize.ValidationError)) {
            console.log('There are errors in the form:');
            error.errors.forEach(({message}) => console.log(message));
            res.render('quizzes/edit', {quiz});
        } else {
            next(error);
        }
    }
};


// DELETE /quizzes/:quizId
exports.destroy = async (req, res, next) => {

    const quizId = Number(req.params.quizId);

    try {
        const quiz = await models.Quiz.findByPk(quizId);
        if (!quiz) {
            throw new Error('There is no quiz with id=' + quizId);
        }

        await quiz.destroy();
        res.redirect('/quizzes');
    } catch (error) {
        next(error);
    }
};


// GET /quizzes/:quizId/play
exports.play = async (req, res, next) => {

    const quizId = Number(req.params.quizId);

    try {
        const quiz = await models.Quiz.findByPk(quizId);
        if (!quiz) {
            throw new Error('There is no quiz with id=' + quizId);
        }

        const answer = req.query.answer || '';

        res.render('quizzes/play', {
            quiz,
            answer
        });
    } catch (error) {
        next(error);
    }
};


// GET /quizzes/:quizId/check
exports.check = async (req, res, next) => {

    const quizId = Number(req.params.quizId);

    try {
        const quiz = await models.Quiz.findByPk(quizId);
        if (!quiz) {
            throw new Error('There is no quiz with id=' + quizId);
        }

        const answer = req.query.answer || "";
        const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();

        res.render('quizzes/result', {
            quiz,
            result,
            answer
        });
    } catch (error) {
        next(error);
    }
};
