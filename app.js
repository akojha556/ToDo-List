const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
mongoose.connect("mongodb+srv://akojha:AmitKumar12@cluster0.jlbo0x9.mongodb.net/myToDoList");

const itemSchema = new mongoose.Schema({
    name: String
});
const Item = mongoose.model("Item", itemSchema);
const item1 = new Item({ name: "Welcome to your ToDo List" });
const item2 = new Item({ name: "Press + to add new item" });
const item3 = new Item({ name: "<----  Hit this checkbox to delete item" });

const defaultItem = [item1, item2, item3];

const listSchema = new mongoose.Schema(
    {
        name: String,
        listItems: [itemSchema]
    }
);

const List = mongoose.model("List", listSchema);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    Item.find({}).then((foundItems) => {
        if (foundItems.length === 0) {
            Item.insertMany(defaultItem).then(() => { "Docs inserted" }).catch((err) => console.log(err));
            res.redirect("/");
        } else {
            res.render("index", { listTitle: "Today", newListItems: foundItems });
        }
    });
});

app.post("/", (req, res) => {
    const newItemName = req.body.newItemName;
    const listName = req.body.listName;
    const newItem = new Item({ name: newItemName });
    if (listName === "Today") {
        newItem.save();
        res.redirect("/");
    } else{
        List.findOne({name: listName}).then((foundList) => {
            foundList.listItems.push(newItem);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});

app.post("/delete", (req, res) => {
    const itemId = req.body.itemId;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndDelete(itemId).then(() => { "Item Removed" }).catch((err) => { console.log(err); });
        res.redirect("/");
    }else{
        List.findOneAndUpdate({name: listName}, {$pull: {listItems: {_id: itemId}}}).then((items) => {
            res.redirect("/" + listName);
        }).catch((err) => {console.log(err);});
    }
});

app.get("/:customeListName", (req, res) => {
    const customeListName = _.capitalize([req.params.customeListName]);
    List.findOne({ name: customeListName }).then((foundList) => {
        if (!foundList) {
            const newList = new List({
                name: customeListName,
                listItems: defaultItem
            });
            newList.save();
            res.redirect("/" + customeListName);
        } else {
            res.render("index", { listTitle: foundList.name, newListItems: foundList.listItems });
        }
    });
});

app.get("/about", (req, res) => {
    res.render("about");
})

app.listen(3000, () => {
    console.log("Server is running at port 3000");
});