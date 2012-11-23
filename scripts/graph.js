elation.component.add('smartmeter.graph', function() {
  this.labels = {
    'costperhour': '$/hr',
    'usageperhour': 'units/hr'
  };
  this.units = {
    'electric': 'kWh',
    'gas': 'therms'
  };
  this.init = function() {
    //console.log(this.args);
    
    //var data = [1, 5, 4, 2, 6, 2, 9, 19, 32, 12, 4, 6];
    this.data = {};
    this.areas = {};
    var maxval = 0;
    this.graphtype = (this.args.graphtype && this.args.graphtype != "" ? this.args.graphtype : 'costperhour');
    this.initgraph();
    this.add("electric", this.args.intervals.electric, this.graphtype);
    this.add("gas", this.args.intervals.gas, this.graphtype);

    var typeselect = elation.ui.select(null, elation.html.create({tag: 'select', append: this.container}));
    typeselect.setItems(['costperhour', 'usageperhour'], this.graphtype);
    elation.events.add(typeselect, "ui_select_change", function(ev) { document.location = "/smartmeter?graphtype=" + ev.target.value; });
  }

  this.initgraph = function() {
    var margin = {top: 10, right: 40, bottom: 100, left: 40},
        margin2 = {top: 430, right: 40, bottom: 20, left: 40};
    this.width = 960 - margin.left - margin.right;

    this.height = 500 - margin.top - margin.bottom;
    this.height2 = 500 - margin2.top - margin2.bottom;

    this.initscales();
    var x = d3.time.scale().range([0, this.width]),
        x2 = d3.time.scale().range([0, this.width]),
        y = d3.scale.linear().range([this.height, 0]),
        y2 = d3.scale.linear().range([this.height2, 0]);

    var xAxis = d3.svg.axis().scale(x).orient("bottom"),
        xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
        yAxis = d3.svg.axis().scale(y).orient("left");
        //yAxis2 = d3.svg.axis().scale(y).orient("right");
    
    var svg = d3.select("body").append("svg")
        .attr("width", this.width + margin.left + margin.right)
        .attr("height", this.height + margin.top + margin.bottom);

    svg.append("defs").append("clipPath")
        .attr("id", "clip")
      .append("rect")
        .attr("width", this.width)
        .attr("height", this.height);

    this.focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    this.context = svg.append("g")
        .attr("class", "context")
        .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

    this.xlabel = this.focus.append("text")
      .attr("class", "x label")
      .attr("text-anchor", "end")
      .attr("x", this.width)
      .attr("y", 20);


    this.x = x;
    this.y = y;
    this.x2 = x2;
    this.y2 = y2;
    this.xAxis = xAxis;
    this.xAxis2 = xAxis2;
    this.yAxis = yAxis;
    //this.yAxis2 = yAxis2;

    this.focus.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + this.height + ")")
      .call(this.xAxis);
    this.context.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + this.height2 + ")")
      .call(this.xAxis2);

    this.focus.append("g")
      .attr("class", "y axis")
      .call(this.yAxis);
    this.focus.append("text")
      .attr("class", "y label")
      .attr("text-anchor", "end")
      .attr("x", 0)
      .attr("y", -2)
      .text(this.labels[this.graphtype]);
  }
  this.initscales = function() {
  }
  
  this.add = function(name, data, field) {
    // FIXME - somehow data is coming through as an object instead of an array, which d3 requires
    var arrdata = []; 
    if (typeof field == 'undefined') field = 'cost';

    var timerange = [0, 0];
    for (var k in data) {
      arrdata.push(data[k]);
      data[k].time = new Date(data[k].start * 1000);

      if (data[k].start < timerange[0]) timerange[0] = data[k].start;
      if (data[k].end > timerange[1]) timerange[1] = data[k].end;
    }
    var x = this.x, y = this.y, x2 = this.x2, y2 = this.y2, y3 = this.yy;
    this.data[name] = arrdata;
    
    var maxtime = d3.max(arrdata.map(function(d) { return d.time; }));
    var mintime = d3.min(arrdata.map(function(d) { return d.time; }));
    // default scale 7 days ago
    this.setrange([new Date(maxtime - 30 * 24 * 60 * 60 * 1000), maxtime]);
    x2.domain([mintime, maxtime]);

    var maxval = d3.max(arrdata.map(function(d) { return d[field]; }));
    var minval = d3.min(arrdata.map(function(d) { return d[field]; }));
    var ydomain = y.domain();
    y.domain([Math.min(ydomain[0], minval), Math.max((ydomain[1] == 1 ? 0 : ydomain[1]), maxval)]);
    y2.domain(y.domain());

    var area = d3.svg.area()
        .interpolate("monotone")
        .x(function(d) { var newx = x(d.time); return newx; })
        .y0(this.height)
        .y1(function(d) { var newy = y(d[field]); return newy; });

    var area2 = d3.svg.area()
        .interpolate("monotone")
        .x(function(d) { var newx = x2(d.time); return newx; })
        .y0(this.height2)
        .y1(function(d) { var newy = y2(d[field]); return newy; });

    this.areas[name] = area; 
    this.areas[name + "_summary"] = area2; 

    this.focus.append("path")
      .attr("class", name)
      .data([arrdata])
      .attr("clip-path", "url(#clip)")
      //.attr("d", area);
    this.context.append("path")
      .attr("class", name)
      .data([arrdata])
      .attr("d", area2);


    this.focus.select(".x.axis").call(this.xAxis);
    this.focus.select(".y.axis").call(this.yAxis);
    //this.focus.select(".y2.axis").call(this.yAxis2);
    this.context.select(".x.axis").call(this.xAxis2);

    if (!this.brush) {
      this.brush = d3.svg.brush()
          .x(x2)
          .on("brush", elation.bind(this, this.onbrush));
      this.brush.extent(x.domain());
    } else {
      this.context.select(".x.brush").remove();
      //this.brush.parentNode.removeChild(this.brush);
    }

    this.context.append("g")
        .attr("class", "x brush")
        .call(this.brush)
      .selectAll("rect")
        .attr("y", -6)
        .attr("height", this.height2 + 7);

    this.setrange();
  }
  this.setrange = function(range) {
    if (range) {
      this.x.domain(range);
    } else {
      range = this.x.domain();
    }
    var totals = [];
    for (var k in this.areas) {
      this.focus.select("path." + k).attr("d", this.areas[k]);
      if (this.data[k]) {
        var rangedata = this.data[k].filter(function(d) { return (d.time >= range[0] && d.time <= range[1]); });
        totals.push({name: k, total: d3.sum(rangedata, elation.bind(this, function(d) { return (this.graphtype == 'costperhour' ? d.cost : d.value / 1000); }))});
      }

    }
    if (totals.length > 0) {
      this.focus.selectAll(".total")
            .data(totals, function(d) { return d.name; })
          .enter().append("text")
            .attr("class", "total")
            
      this.focus.selectAll(".total")
            .data(totals, function(d) { return d.name; })
            .attr("class", function(d) { return "total " + d.name; })
            .attr("text-anchor", "end")
            .attr("x", this.width)
            .attr("y", function(d, i) { return 40 + i * 20; })
            .text(elation.bind(this, function(d) { return d.name + ": " + (this.graphtype == 'costperhour' ? '$' + d.total.toFixed(2) : d.total.toFixed(2) + " " + this.units[d.name]); }));
    }

    this.focus.select(".x.axis").call(this.xAxis);
    this.xlabel.text(elation.utils.dateformat("D M j H:m", range[0]) + " - " + elation.utils.dateformat("D M j H:m", range[1]));

    var dayticks = [];
    var startdate = new Date(range[0].getFullYear(), range[0].getMonth(), range[0].getDate(), 0, 0);
    for (var d = startdate.getTime(); d <= range[1].getTime(); d += 86400000) {
      dayticks.push(new Date(d));
    }
//console.log(dayticks);
    var x = this.x;
    var lines = this.focus.selectAll(".daytick")
         .remove();
    this.focus.selectAll(".daytick").data(dayticks).enter().append("line")
         .attr("class", "daytick")
         .attr("x1", this.x)
         .attr("x2", this.x)
         .attr("y1", 0)
         .attr("y2", this.height)
         .style("stroke", "rgba(225,225,225,.25)");
    //lines.exit().remove()

    

  }
  this.onbrush = function() {
    if (!this.brushtimer) {
      this.brushtimer = setTimeout(elation.bind(this, function() {
        this.setrange(this.brush.empty() ? this.x2.domain() : this.brush.extent());
        this.brushtimer = false;
      }), 1000/60);
    }
  }
});
