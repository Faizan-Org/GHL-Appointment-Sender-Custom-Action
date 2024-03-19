const express = require('express');
const index = express();
const Routes = require('./routes/route');
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const bodyParser = require("body-parser");
const port = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    require("dotenv").config();
}

index.use(express.json());
index.use(bodyParser.urlencoded({extended: true}));
index.use(bodyParser.json());
index.use(morgan("dev"));
index.use(cors());
index.use(helmet());

index.use(Routes);
index.get("*", (_, res) => {
    res.status(200).send("Running... OK!");
})

index.listen(port, () => {
    console.log(`Server running on port http://localhost:${port}`);
});