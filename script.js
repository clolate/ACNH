// codigo basado en:
// https://observablehq.com/@tezzutezzu/world-history-timeline

var filter = (a, b) => b.price - a.price || a.name.localeCompare(b.name);
var month = "Jan";
var gData = {};
var gY = {};
var rect = document.getElementById("div1").getBoundingClientRect();

const sortFishes = () => {
  var x = document.getElementById("filter").value;
  switch (x) {
    case "price":
      filter = (a, b) => b.price - a.price || a.name.localeCompare(b.name);
      break;
    case "name":
      filter = (a, b) => a.name.localeCompare(b.name);
      break;
    case "location":
      filter = (a, b) => a.where.localeCompare(b.where) || b.price - a.price;
      break;
    default:
      filter = (a, b) => b.price - a.price;
      break;
  }

  for (const m of months) {
    const civs = d3.select(`#${m}`).selectAll(".fish");
    gData[m] = gData[m].sort(filter);
    civs
      .data(gData[m], (d) => d.name)
      .transition()
      .ease(d3.easeCubic)
      .attr("transform", (d, i) => `translate(0 ${gY[m](i)})`);
  }
};

const changeMonth = () => {
  var x = document.getElementById("month").value;
  d3.select(`#${month}`).attr("style", "display: none");
  month = x;
  d3.select(`#${month}`).attr("style", "display: block");
};

const timeParse = (d) => {
  function getShift(v) {
    return v == "AM" ? 0 : 12;
  }

  if (d == "All day") {
    return { count: 1, start1: 0, end1: 24 };
  } else if (d == "NA") {
    return { count: 0 };
  } else {
    let data = d.split("; ");
    if (data.length == 1) {
      data = data[0];
      data = data.split(" –");
      let start = data[0].split(" ");
      let end = data[1].split(" ");
      start = parseInt(start[0]) + getShift(start[1]);
      end =
        end.length == 2
          ? parseInt(end[0]) + getShift(end[1])
          : parseInt(end[1]) + getShift(end[2]);

      if (start <= end) {
        return {
          count: 1,
          start1: start,
          end1: end,
        };
      } else {
        return {
          count: 2,
          start1: 0,
          end1: end,
          start2: start,
          end2: 24,
        };
      }
    } else {
      let data1 = data[0];
      data1 = data1.split(" –");
      let start1 = data1[0].split(" ");
      let end1 = data1[1].split(" ");
      start1 = parseInt(start1[0]) + getShift(start1[1]);
      end1 =
        end1.length == 2
          ? parseInt(end1[0]) + getShift(end1[1])
          : parseInt(end1[1]) + getShift(end1[2]);

      let data2 = data[1];
      data2 = data2.split(" –");
      let start2 = data2[0].split(" ");
      let end2 = data2[1].split(" ");
      start2 = parseInt(start2[0]) + getShift(start2[1]);
      end2 =
        end2.length == 2
          ? parseInt(end2[0]) + getShift(end2[1])
          : parseInt(end2[1]) + getShift(end2[2]);

      return {
        count: 3,
        start1: start1,
        end1: end1,
        start2: 0,
        end2: end2,
        start3: start2,
        end3: 24,
      };
    }
  }
};

const parse = (d) => {
  var time = timeParse(d["SH " + month]);
  return {
    name: d.Name[0].toUpperCase() + d.Name.substring(1, d.Name.length),
    price: parseInt(d.Sell),
    where: d["Where/How"].substring(0, 3) == "Sea" ? "Sea" : d["Where/How"],
    rainsnow: d["Rain/Snow Catch Up"],
    count: time.count,
    start1: time.count >= 1 ? time.start1 : undefined,
    end1: time.count >= 1 ? time.end1 : undefined,
    start2: time.count >= 2 ? time.start2 : undefined,
    end2: time.count >= 2 ? time.end2 : undefined,
    start3: time.count >= 3 ? time.start3 : undefined,
    end3: time.count >= 3 ? time.end3 : undefined,
  };
};

var months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const readCsv = async () => {
  for (const m of months) {
    month = m;
    // Parse the Data
    await d3.csv("datasets/fish.csv", parse).then((data) => {
      gData[m] = data;
      // set the dimensions and margins of the graph
      var margin = { top: 30, right: 30, bottom: 30, left: 200 };
      var height = 1500;
      var width = 900;

      let regions = d3
        .nest()
        .key((d) => d.where)
        .entries(data)
        .map((d) => d.key);

      let color = d3.scaleOrdinal(d3.schemeCategory10).domain(regions);
      data.forEach((d) => (d.color = d3.color(color(d.where))));
      data = data.sort(filter);

      // append the svg object to the body of the page
      var svg = d3
        .select("#div1")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("id", m)
        .attr("style", m == "Jan" ? "display: block" : "display: none");

      var g = svg
        .append("g")
        .attr("transform", (d, i) => `translate(${margin.left} ${margin.top})`);

      // X axis
      const formatTime = (d) => {
        var n = d < 12 || d == 24 ? "AM" : "PM";
        d = d % 12;
        d = d == 0 ? 12 : d;
        return `${d} ${n}`;
      };

      var x = d3
        .scaleLinear()
        .domain([0, 24])
        .range([0, width - margin.left - margin.right]);

      var axisTop = d3.axisTop(x).tickPadding(2).tickFormat(formatTime);

      var axisBottom = d3.axisBottom(x).tickPadding(2).tickFormat(formatTime);

      svg
        .append("g")
        .attr(
          "transform",
          (d, i) => `translate(${margin.left} ${margin.top - 10})`
        )
        .call(axisTop);

      svg
        .append("g")
        .attr(
          "transform",
          (d, i) => `translate(${margin.left} ${height - margin.bottom + 10})`
        )
        .call(axisBottom);

      // Y axis
      var y = d3
        .scaleBand()
        .range([0, height - margin.bottom - margin.top])
        .domain(d3.range(data.length))
        .padding(0.2);
      gY[month] = y;

      //Bars
      var groups = g
        .selectAll("g")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "fish");

      const createTooltip = (el) => {
        el.style("position", "absolute")
          .style("pointer-events", "none")
          .style("top", 0)
          .style("opacity", 0)
          .style("background", "white")
          .style("border-radius", "5px")
          .style("box-shadow", "0 0 10px rgba(0,0,0,.25)")
          .style("padding", "10px")
          .style("line-height", "1.3")
          .style("font", "11px sans-serif")
          .style("display","flex")
          .style("justify-content", "space-between")
          .style("align-items", "center");
      };

      const getTooltipContent = (d) => {
        // https://stackoverflow.com/questions/32589197/how-can-i-capitalize-the-first-letter-of-each-word-in-a-string-using-javascript
        function titleCase(str) {
          var splitStr = str.toLowerCase().split(' ');
          for (var i = 0; i < splitStr.length; i++) {
              // You do not need to check if i is larger than splitStr length, as your for does that for you
              // Assign it back to the array
              splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
          }
          // Directly return the joined string
          return splitStr.join(' '); 
       }
        var src = "fish/"+titleCase(d.name).replace(/\s/g, "_")+"_NH_Icon.png"
        return `<div style="margin-right:10px">
    <img src="${src}" alt="${d.name}"></div>
    <div><b>${d.name}</b>
    <br/>
    Price: <b>${d.price}B</b>
    <br/>
    Location: <b style="color:${d.color.darker()}">${d.where}</b>
    <br/>
    Rain/Snow: <b>${d.rainsnow}</b></div>
    `;
      };

      const line = svg
        .append("line")
        .attr("y1", margin.top - 10)
        .attr("y2", height - margin.bottom)
        .attr("stroke", "rgba(0,0,0,0.2)")
        .style("pointer-events", "none");

      const tooltip = d3.select("#tooltip").call(createTooltip);

      groups.attr("transform", (d, i) => `translate(0 ${y(i)})`);

      groups
        .each((d, i, n) => {
          const el = d3.select(n[i]);
          if (d.count == 0) {
            el.append("text")
              .text(d.name)
              .attr("x", -10)
              .attr("y", 1)
              .attr("fill", "black")
              .style("text-anchor", "end")
              .style("dominant-baseline", "hanging");
            return;
          }
          let sx = x(d.start1);
          let w = x(d.end1) - x(d.start1);

          el.style("cursor", "pointer");
          el.append("rect")
            .attr("x", sx)
            .attr("height", y.bandwidth())
            .attr("width", w)
            .attr("fill", d.color);

          if (d.count >= 2) {
            sx = x(d.start2);
            w = x(d.end2) - x(d.start2);
            el.append("rect")
              .attr("x", sx)
              .attr("height", y.bandwidth())
              .attr("width", w)
              .attr("fill", d.color);
          }

          if (d.count >= 3) {
            sx = x(d.start3);
            w = x(d.end3) - x(d.start3);
            el.append("rect")
              .attr("x", sx)
              .attr("height", y.bandwidth())
              .attr("width", w)
              .attr("fill", d.color);
          }

          el.append("text")
            .text(d.name)
            .attr("x", -10)
            .attr("y", 1)
            .attr("fill", "black")
            .style("text-anchor", "end")
            .style("dominant-baseline", "hanging");
        })
        .on("mouseover", (d, i, n) => {
          const el = d3.select(n[i]);
          el.selectAll("rect").attr("fill", d.color.darker());
          tooltip.style("opacity", 1).html(getTooltipContent(d));
        })
        .on("mouseleave", (d, i, n) => {
          const el = d3.select(n[i]);
          el.selectAll("rect").attr("fill", d.color);
          tooltip.style("opacity", 0);
        });

      svg.on("mousemove", function (d) {
        let [x, y] = d3.mouse(this);
        line.attr("transform", `translate(${x} 0)`);
        y += 20;
        if (x > width / 2) x -= 100;

        tooltip
          .style("left", x + rect.left + "px")
          .style("top", y + rect.top + 170 + "px");
      });
    });
  }
  month = "Jan";
};
readCsv();
