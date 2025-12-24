let Tab = "Move";
let road;
let Time = 1;
let timespeed = 1;

let object = {
  select: 0,
  Move: [],
  Building: [
    {
      name: "Residential",
      color: "rgba(0, 255, 0, 0.3)",
      width: 50,
      height: 50,
    },
    {
      name: "Residential",
      color: "rgba(33, 55, 223, 0.3)",
      width: 100,
      height: 150,
    },
    {
      name: "Residential",
      color: "rgba(33, 55, 223, 0.3)",
      width: 150,
      height: 100,
    },
  ],
  Trees: [
    {
      name: "Residential",
      color: "rgba(0, 255, 0, 0.3)",
      width: 50,
      height: 50,
    },{
      name: "Residelppp",
      color: "rgba(156, 141, 41, 0.3)",
      width: 10,
      height: 10,
    },
  ],
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

function tabChange(e, self) {
  e.stopPropagation();
  e.preventDefault();
  Tab = self.innerText;

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
  //console.log(object, Tab);
  if (object[Tab].length > 0) {
    object[Tab].forEach((object, i) => {
      obj.innerHTML += `
      <div onmousedown="event.stopPropagation()" onclick="selectObj(event,${i})" style="background-color: ${object.color};">
        ${object.name}
      </div>`;
      selectObj(null, i);
    });
  }
}

function selectObj(e, i) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }

  object.select = i;
}
