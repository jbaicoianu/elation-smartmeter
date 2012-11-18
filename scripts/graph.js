elation.component.add('smartmeter.graph', function() {
  this.init = function() {
    //console.log(this.args);
    
    //var data = [1, 5, 4, 2, 6, 2, 9, 19, 32, 12, 4, 6];
    var data = [];
    var maxval = 0;
    this.plot(this.args.intervals);
  }
  
  this.plot = function(data) {
    // FIXME - somehow data is coming through as an object instead of an array, which d3 requires
    //         so we convert it, but also use this opportunity to find the max value for this dataset
    var arrdata = []; 
    var maxval = 0;

    var timerange = [0, 0];
    for (var k in data) {
      arrdata.push(data[k]);
      data[k].time = new Date(data[k].start * 1000);

      if (data[k].start < timerange[0]) timerange[0] = data[k].start;
      if (data[k].end > timerange[1]) timerange[1] = data[k].end;
      
      if (data[k].value > maxval) {
        maxval = data[k].value;
      }
    }
    
    var margin = {top: 10, right: 10, bottom: 100, left: 40},
        margin2 = {top: 430, right: 10, bottom: 20, left: 40},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom,
        height2 = 500 - margin2.top - margin2.bottom;

    var x = d3.time.scale().range([0, width]),
        x2 = d3.time.scale().range([0, width]),
        y = d3.scale.linear().range([height, 0]),
        y2 = d3.scale.linear().range([height2, 0]);

    var xAxis = d3.svg.axis().scale(x).orient("bottom"),
        xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
        yAxis = d3.svg.axis().scale(y).orient("left");
    
    this.brush = d3.svg.brush()
        .x(x2)
        .on("brush", elation.bind(this, this.onbrush));

    var area = d3.svg.area()
        .interpolate("monotone")
        .x(function(d) { var newx = x(d.time); return newx; })
        .y0(height)
        .y1(function(d) { var newy = y(d.value); return newy; });

    var area2 = d3.svg.area()
        .interpolate("monotone")
        .x(function(d) { var newx = x2(d.time); return newx; })
        .y0(height2)
        .y1(function(d) { var newy = y2(d.value); return newy; });

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
      .append("rect")
        .attr("width", width)
        .attr("height", height);

    this.focus = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    this.context = svg.append("g")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

    this.x = x;
    this.y = y;
    this.x2 = x2;
    this.y2 = y2;
    this.xAxis = xAxis;
    this.area = area;

    x.domain(d3.extent(arrdata.map(function(d) { return d.time; })));
    y.domain([0, d3.max(arrdata.map(function(d) { return d.value; }))]);
    x2.domain(x.domain());
    y2.domain(y.domain());

    this.focus.append("path")
      .data([arrdata])
      .attr("clip-path", "url(#clip)")
      .attr("d", area);
    this.focus.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);
    this.focus.append("g")
      .attr("class", "y axis")
      .call(yAxis);
    this.focus.append("text")
      .attr("class", "x label")
      .attr("text-anchor", "end")
      .attr("x", 0)
      .attr("y", -2)
      .text("Watts/h");

    this.context.append("path")
      .data([arrdata])
      .attr("d", area2);
    this.context.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height2 + ")")
      .call(xAxis2);
    this.context.append("g")
        .attr("class", "x brush")
        .call(this.brush)
      .selectAll("rect")
        .attr("y", -6)
        .attr("height", height2 + 7);

  }
  this.onbrush = function() {
    this.x.domain(this.brush.empty() ? this.x2.domain() : this.brush.extent());
    this.focus.select("path").attr("d", this.area);
    this.focus.select(".x.axis").call(this.xAxis);
  }
});
