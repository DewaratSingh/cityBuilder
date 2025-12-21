let Tab = "Move";
let road;

let object = {
  select:0,
  Move: [],
  Building: [
    {
      name: "Residential",
      color: "rgba(0, 255, 0, 0.3)",
      width:50,
      height:50,
    },{
      name: "Residential",
      color: "rgba(33, 55, 223, 0.3)",
      width:100,
      height:150,
    },{
      name: "Residential",
      color: "rgba(33, 55, 223, 0.3)",
      width:150,
      height:100,
    }
  ],
  Trees: [],
  Zone: [
    {
      name: "Residential",
      width: 50,
      color: "rgba(0, 255, 0, 0.3)",
    },
    {
      name: "Comeritial",
      width: 25,
      color: "rgba(0, 0, 255, 0.3)",
    },
    {
      name: "industry",
      width: 25,
      color: "rgba(255, 0, 0, 0.3)",
    },
  ],
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
  console.log(Tab)

  if (Tab == "Road") {
    road.editMode = true;
  } else {
    road.editMode = false;
  }
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

if (object[Tab].length > 0) {
  object[Tab].forEach((object, i) => {
    obj.innerHTML += `
      <div onclick="selectObj(${i})" style="background-color: ${object.color};">
        ${object.name}
      </div>`;
  });
}



}

function selectObj(i) {
  object.select=i;
}
