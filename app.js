//jshint esversion:6

import express from "express";
import bodyParser from "body-parser";
import {getDate} from "./date.js";
import _ from "lodash";

//import {getDay} from "./date.js";
import mongoose from "mongoose";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema= new mongoose.Schema({
  name: String
});
const listSchema=new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})
const List= mongoose.model("List",listSchema);
const Item = mongoose.model("Item",itemsSchema);
const item1=new Item({
  name: "Welcome to your todolist"
});
const item2=new Item({
  name: "Hit the + button to add a new item"
});

const item3=new Item({
  name: "<-- Hit this to delete an item"
});
const defaultItems=[item1, item2, item3];




// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

app.get("/", function(req, res) {

  const day = getDate();

  Item.find({},function (err,foundItems) {
    if(foundItems.length==0){
      Item.insertMany(defaultItems, function (error) {
        if (error)
          console.log(error);
        else
          console.log("Inserted successfully");
      })
    }
    res.render("list", {listTitle: "Today", newListItems: foundItems});
  })



});

app.post("/", function(req, res){

  const item = req.body.newItem;
  const listName=req.body.list;
  if(listName=="Today"){
    Item.insertMany([{name: item}]);
    res.redirect("/");
  }else{
    List.findOne({name: listName},function (error, result) {
      if(!error){
        if(!result){
          console.log("Unable to find list");
        }
        else{
          result.items.push(new Item({name: item}));
          result.save();
          res.redirect("/"+listName);
        }
      }
    });

  }

  // if (req.body.list === "Work") {
  //   // workItems.push(item);
  //   // res.redirect("/work");
  // } else {
  //   Item.insertMany([addItem]);
  //   res.redirect("/");
  // }

});
app.post("/delete",function (req,res) {
  //console.log(req.body.checkbox);
  const listName=req.body.listName;
  if(listName=="Today") {
    Item.findByIdAndRemove(req.body.checkbox, function (error) {
      if (error)
        console.log("error");
      else
        console.log("success");
    });
    res.redirect("/");
  }else{
    List.findOneAndUpdate({name: listName},{$pull: {items:{_id: req.body.checkbox}}},function (err,foundList) {
      if(!err){
        res.redirect("/"+listName);
      }
    })

  }

});
app.get("/:customListName",function (req,res) {
  const customListName=_.capitalize(req.params.customListName);

  List.find({name: customListName},function (error, result) {
    if(result.length==0){
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
//      res.render("list",{listTitle: customListName, newListItems: list.items});
      res.redirect("/"+customListName);
    }else{
      console.log(result.items);
      res.render("list",{listTitle: result[0].name, newListItems: result[0].items});
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
