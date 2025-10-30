let Tab = "Move";
let selectedRoad = {};
let road;

let object = {
  Move: [],
  Building: [],
  Trees: [],
  Object: [],
  Road: [
    {
      name: "oneway Road",
      width: 50,
      color: "#656E76",
    },
    {
      name: "PathWayRoad",
      width: 25,
      color: "#A6A9A4",
    },
    {
      name: "RawRoad",
      width: 25,
      color: "#DBB292",
    },
    {
      name: "pathWay",
      width: 1,
      color: "#DBB292",
    },
  ],
};

function tabChange(self) {
  Tab = self.innerHTML;


  if (Tab == "Move") {
    road.editMode=false
    document.getElementById("selector").style.height = "55px";
    document.getElementById("constructionline").style.display = "none";
  } else {
    road.editMode=true
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
  object[Tab].forEach((object, i) => {
    obj.innerHTML += `<div onclick='selectObj(${i})' style="background-image:url('${object.img}');">${object.name}</div>`;
  });
}

function selectObj(i) {
  if (Tab == "Road") {
    selectedRoad = object[Tab][i];
  }
}
