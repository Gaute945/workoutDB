import express from "express";
import { engine } from 'express-handlebars';

const app = express();

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.urlencoded({ extended: false }))

const messages = [
    "hello",
    "world!"
];

app.get('/', (req, res) => {
	res.render('home', {
        messages
    });
});

app.post('/messages', (req, res) => {
    messages.push(req.body.content)
    res.redirect('/')
})

app.listen(8000, () => {
	console.log('listing on port 8000');
});
