// código basado en:
// https://www.d3-graph-gallery.com/graph/heatmap_tooltip.html

// set the dimensions and margins of the graph
var margin = { top: 30, right: 30, bottom: 100, left: 60 },
  width = 1000 - margin.left - margin.right,
  height = 360 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3
  .select("#div2")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//Read the data
d3.csv("datasets/villagers.csv").then((data) => {
  // Labels of row and columns
  var groups = Array.from(new Set(data.map((d) => d.Species)));
  var vars = Array.from(new Set(data.map((d) => d.Personality)));
  var matrix = [];
  for (const _ in vars) {
    let row = [];
    for (const _ in groups) {
      row.push({ count: 0, villagers: [] });
    }
    matrix.push(row);
  }

  data.forEach((d) => {
    let i = vars.indexOf(d.Personality);
    let j = groups.indexOf(d.Species);
    matrix[i][j].count = matrix[i][j].count + 1;
    matrix[i][j].villagers.push(d.Name);
  });

  var dataCount = [];
  for (const i in vars) {
    let row = matrix[i];
    let v = vars[i];
    for (const j in groups) {
      let g = groups[j];
      dataCount.push({
        count: row[j].count,
        villagers: row[j].villagers,
        group: g,
        var: v,
      });
    }
  }

  var max = 0;
  matrix.forEach((row) => {
    var localMax = Math.max(...row.map((x) => x.count));
    max = Math.max(max, localMax);
  });

  // Build X scales and axis:
  var x = d3.scaleBand().range([0, width]).domain(groups).padding(0.01);
  svg
    .append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", "-.6em")
    .attr("transform", "rotate(-90)");

  // Build X scales and axis:
  var y = d3.scaleBand().range([height, 0]).domain(vars).padding(0.01);
  svg.append("g").call(d3.axisLeft(y));

  // Build color scale
  var colors = d3.scaleLinear().range(["white", "black"]).domain([0, max]);

  // create a tooltip
  const tooltip = d3
    .select("#tooltip2")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("top", 0)
    .style("opacity", 0)
    .style("background", "white")
    .style("border-radius", "5px")
    .style("box-shadow", "0 0 10px rgba(0,0,0,.25)")
    .style("padding", "10px")
    .style("line-height", "1.3")
    .style("font", "11px sans-serif");

  // Three function that change the tooltip when user hover / move / leave a cell
  var mouseover = (d) => {
    tooltip.style("opacity", 1);
  };
  var mousemove = (d, i, n) => {
    tooltip
      .html(
        `<b>Cantidad:</b> ${d.count}<br/>
                            <hr style="border-top: 1px solid #ccc; border-bottom: 0px solid #ccc;">
        <b>Especie:</b> ${d.group}<br/>
        <b>Personalidad:</b> ${d.var}<br/>
          <b>Aldeanos:</b>
          ${d.villagers.map((x) => `<br/>${x}`)}
            `
      )
      .style("left", d3.event.pageX + "px")
      .style("top", d3.event.pageY + "px");
  };
  var mouseleave = (d) => {
    tooltip.style("opacity", 0);
  };

  // add the squares
  svg
    .selectAll()
    .data(dataCount, (d) => {
      return d.group + ":" + d.var;
    })
    .enter()
    .append("rect")
    .attr("x", (d) => {
      return x(d.group);
    })
    .attr("y", (d) => {
      return y(d.var);
    })
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .style("fill", (d) => {
      return colors(d.count);
    })
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave);
});
