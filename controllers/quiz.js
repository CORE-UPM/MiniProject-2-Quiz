const Sequelize = require("sequelize");
const {models} = require("../models");

// Autoload el quiz asociado a :quizId
exports.load = async (req, res, next, quizId) => {

    try {
        const quiz = await models.Quiz.findByPk(quizId, {
            include: [
                {model: models.Attachment, as: 'attachment'}
            ]
        });
        if (quiz) {
            req.load = {...req.load, quiz};
            next();
        } else {
            throw new Error('There is no quiz with id=' + quizId);
        }
    } catch (error) {
        next(error);
    }
};

// GET /quizzes
exports.index = async (req, res, next) => {

    try {
        const findOptions = {
            include: [
                {model: models.Attachment, as: 'attachment'}
            ]
        };
        const quizzes = await models.Quiz.findAll(findOptions);
        res.render('quizzes/index.ejs', {quizzes});
    } catch (error) {
        next(error);
    }
};


// GET /quizzes/:quizId
exports.show = (req, res, next) => {

    const {quiz} = req.load;

    res.render('quizzes/show', {quiz});
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
        console.log('Success: Quiz created successfully.');

        try {
            if (!req.file) {
                console.log('Info: Quiz without attachment.');
                return;
            }

            // Create the quiz attachment
            await createQuizAttachment(req, quiz);

        } catch (error) {
            console.log('Error: Failed to create attachment: ' + error.message);
        } finally {
            res.redirect('/quizzes/' + quiz.id);
        }
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


// Aux function to upload req.file to cloudinary, create an attachment with it, and
// associate it with the gien quiz.
// This function is called from the create an update middleware. DRY.
const createQuizAttachment = async (req, quiz) => {

    const image = req.file.buffer.toString('base64');
    const url = `${req.protocol}://${req.get('host')}/quizzes/${quiz.id}/attachment`;

    // Create the new attachment into the data base.
    const attachment = await models.Attachment.create({
        mime: req.file.mimetype,
        image,
        url
    });
    await quiz.setAttachment(attachment);
    console.log('Success: Attachment saved successfully.');
};

// GET /quizzes/:quizId/edit
exports.edit = (req, res, next) => {

    const {quiz} = req.load;

    res.render('quizzes/edit', {quiz});
};


// PUT /quizzes/:quizId
exports.update = async (req, res, next) => {

    const {quiz} = req.load;

    quiz.question = req.body.question;
    quiz.answer = req.body.answer;

    try {
        await quiz.save({fields: ["question", "answer"]});
        console.log('Success: Quiz edited successfully.');

        try {
            if (!req.file) {
                console.log('Info: Quiz attachment not changed.');
                return;
            }

            // Delete old attachment.
            if (quiz.attachment) {
                await quiz.attachment.destroy();
                await quiz.setAttachment();
            }

            // Create the quiz attachment
            await createQuizAttachment(req, quiz);

        } catch (error) {
            console.log('Error: Failed saving the new attachment: ' + error.message);
        } finally {
            res.redirect('/quizzes/' + quiz.id);
        }
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

    const attachment = req.load.quiz.attachment;

    try {
        await req.load.quiz.destroy();
        attachment && await attachment.destroy();
        console.log('Success: Quiz deleted successfully.');
        res.redirect('/quizzes');
    } catch (error) {
        console.log('Error: Error deleting the Quiz: ' + error.message);

        next(error);
    }
};


// GET /quizzes/:quizId/play
exports.play = async (req, res, next) => {

    const {quiz} = req.load;

    const answer = req.query.answer || '';

    res.render('quizzes/play', {
        quiz,
        answer
    });
};


// GET /quizzes/:quizId/check
exports.check = async (req, res, next) => {

    const {quiz} = req.load;

    const answer = req.query.answer || "";
    const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();

    res.render('quizzes/result', {
        quiz,
        result,
        answer
    });
};


// GET /quizzes/:quizId/attachment
exports.attachment = (req, res, next) => {

    const {quiz} = req.load;

    const {attachment} = quiz;

    if (!attachment) {
        res.redirect("/images/none.png");
    } else if (attachment.image) {
        res.type(attachment.mime);
        res.send(Buffer.from(attachment.image.toString(), 'base64'));
    } else if (attachment.url) {
        res.redirect(attachment.url);
    } else {
        res.redirect("/images/none.png");
    }
}
