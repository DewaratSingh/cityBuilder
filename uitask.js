let Tab = "Move";
let selectedRoad={}
let road;

let object = {
  Move: [],
  Building: [],
  Trees: [],
  Object: [],
  Road: [
    {
      name: "oneway Road",
      img: "./assert/Screenshot 2025-10-19 101745.png",
      width: 50,
      color: "grey",
    },{
      name: "PathWay",
      img: "./assert/Screenshot 2025-10-19 101745.png",
      width: 25,
      color: "white",
    },
  ],
};

function tabChange(self) {
  Tab = self.innerHTML;
  road.sort()

  if (Tab == "Move") {
    document.getElementById("selector").style.height = "55px";
    document.getElementById("constructionline").style.display = "none";
  } else {
    document.getElementById("selector").style.height = "180px";
    document.getElementById("constructionline").style.display = "block";
  }
  let options = document.querySelectorAll("#option div");
  options.forEach((div) => {
    div.style.backgroundColor = "rgba(153, 205, 50, 0.363)";
  });
  self.style.backgroundColor = "rgb(112, 149, 39)";

  let obj = document.getElementById("obj");
  obj.innerHTML = "";
  object[Tab].forEach((object,i) => {
    obj.innerHTML += `<div onclick='selectObj(${i})' style="background-image:url('${object.img}');">${object.name}</div>`;
  });
}


function selectObj(i){
  if(Tab=="Road"){
    selectedRoad=object[Tab][i]
  }
console.log(obj)
}