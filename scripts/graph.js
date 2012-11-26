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
    this.xdomain = [new Date(), new Date(0)]; // default min/max will be updated as data is added
    this.ydomain = [0, 0];
    this.graphtype = (this.args.graphtype && this.args.graphtype != "" ? this.args.graphtype : 'costperhour');
    this.initgraph();
    this.setrange([new Date(new Date() - 7 * 24 * 60 * 60 * 1000), new Date()]);
    if (!elation.utils.isEmpty(this.args.intervals)) {
      for (var k in this.args.intervals) {
        this.add(k, this.processdata(k, this.args.intervals[k]), this.graphtype);
      }
      this.setrange([new Date(this.xdomain[1] - 7 * 24 * 60 * 60 * 1000), new Date(this.xdomain[1])]);
    }
    this.updatebrush();
    this.initdroptarget();

    var typeselect = elation.ui.select(null, elation.html.create({tag: 'select', append: this.container}));
    typeselect.setItems(['costperhour', 'usageperhour', 'usageperday'], this.graphtype);
    elation.events.add(typeselect, "ui_select_change", this);

    elation.events.add(this, "ui_droptarget_drop", this);
  }

  this.initgraph = function() {
    var margin = {top: 10, right: 40, bottom: 100, left: 40},
        margin2 = {top: 430, right: 0, bottom: 20, left: 40};
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
    
    var svg = d3.select(this.container).append("svg")
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
  this.processdata = function(name, data) {
    var arrdata = []; 

    if (elation.utils.isArray(data)) {
      arrdata = data;
    } else {
      for (var k in data) {
        arrdata.push(data[k]);
      }
    }
    for (var i = 0; i < arrdata.length; i++) {
      arrdata[i].time = new Date(arrdata[i].start * 1000);
    }
    this.data[name] = arrdata;
    return arrdata;
  }
  
  this.add = function(name, data, field) {
    if (typeof field == 'undefined') field = 'cost';
    var x = this.x, y = this.y, x2 = this.x2, y2 = this.y2;
    
    var maxtime = d3.max(data.map(function(d) { return d.time; }));
    var mintime = d3.min(data.map(function(d) { return d.time; }));
    // default scale 7 days ago
    this.xdomain = [new Date(Math.min(this.xdomain[0], mintime)), new Date(Math.max(this.xdomain[1], maxtime))];
    x2.domain(this.xdomain);

    var maxval = d3.max(data.map(function(d) { return d[field]; }));
    var minval = d3.min(data.map(function(d) { return d[field]; }));
    y.domain([Math.min(this.ydomain[0], minval), Math.max(this.ydomain[1], maxval)]);
    y2.domain(y.domain());
    this.ydomain = y.domain();

    if (!this.areas[name]) {
      this.areas[name] = d3.svg.area()
          .interpolate("monotone")

      this.areas[name + "_summary"] = d3.svg.area()
          .interpolate("monotone")
    }
    var area = this.areas[name];
    var area2 = this.areas[name + "_summary"];

    area
          .x(function(d) { var newx = x(d.time); return newx; })
          .y0(this.height)
          .y1(function(d) { var newy = y(d[field]); return newy; });
    area2
          .x(function(d) { var newx = x2(d.time); return newx; })
          .y0(this.height2)
          .y1(function(d) { var newy = y2(d[field]); return newy; });
  

    var foo = this.focus.selectAll("path." + name);
    if (foo[0].length == 0) {
      foo = this.focus.append("path")
        .attr("class", name)
        .attr("clip-path", "url(#clip)")
    }
    foo.data([data])

    this.context.selectAll("path." + name).remove();
    this.context.append("path")
      .attr("class", name)
      .data([data])
      .attr("d", area2);

    /*
    var nest = d3.nest()
        .key(function(d) { return d.time.getFullYear(); })
        .key(function(d) { return d.time.getMonth(); })
        .key(function(d) { return d.time.getDate(); })
        .entries(data);
    */
    this.updatebrush();
  }
  this.setscale = function(scale) {
    if (scale) {
      this.y.domain(scale);
    } else {
      scale = this.y.domain();
    }
    for (var k in this.areas) {
      if (this.data[k]) {
      }
    }
  }
  this.setrange = function(range, animate) {
    if (range) {
      this.x.domain(range);
    } else {
      range = this.x.domain();
    }
    var totals = [];
    for (var k in this.data) {
      this.update(k, animate);
      var t = this.rangesum(k, range)
      totals.push(t);
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
    this.focus.selectAll(".daytick")
        .data(dayticks)
      .enter().append("line")
         .attr("class", "daytick")
         .attr("x1", this.x)
         .attr("x2", this.x)
         .attr("y1", 0)
         .attr("y2", this.height)
         .style("stroke", "rgba(225,225,225,.25)");
    //lines.exit().remove()
    this.focus.select(".x.axis").call(this.xAxis);
    this.focus.select(".y.axis").call(this.yAxis);
    //this.focus.select(".y2.axis").call(this.yAxis2);
    this.context.select(".x.axis").call(this.xAxis2);
  }
  this.update = function(name, animate) {
    if (animate && false) {
      this.focus.select("path." + name).transition().duration(000).ease('cubic-out').attr("d", this.areas[name]);
    } else {
      this.focus.select("path." + name).attr("d", this.areas[name]);
    }
  }
  this.updatebrush = function() {
    var x = this.x, x2 = this.x2;
    if (!this.brush) {
      this.brush = d3.svg.brush()
          .x(x2)
          .on("brush", elation.bind(this, this.onbrush));
    } else {
      this.context.select(".x.brush").remove();
    }
    this.brush.extent(x.domain());

    this.context.append("g")
        .attr("class", "x brush")
        .call(this.brush)
      .selectAll("rect")
        .attr("y", -6)
        .attr("height", this.height2 + 7);
  }
  this.rangesum = function(name, range) {
    if (this.data[name]) {
      var rangedata = this.data[name].filter(function(d) { return (d.time >= range[0] && d.time <= range[1]); });
      return {name: name, total: d3.sum(rangedata, elation.bind(this, function(d) { return (this.graphtype == 'costperhour' ? d.cost : d.value / 1000); }))};
    }
  }
  this.clear = function() {
    for (var name in this.data) {
      this.focus.selectAll("path." + name).remove();
      this.context.selectAll("path." + name + "_summary").remove();
    }
    this.focus.selectAll(".total").remove();
    this.data = {};
  }
  this.loadzip = function(data) {
    var zip = new JSZip(data);
    this.clear();
    var re = new RegExp("^pge_(.*?)_interval_data");
    for (var k in zip.files) {
      var m = re.exec(k);
      var xmldata = elation.utils.parseXML(zip.files[k].data);
      var foo = elation.utils.arrayget(xmldata, "feed._children.entry.3._children.content._children.IntervalBlock._children.IntervalReading");
      var intervals = [];
      for (var i = 0; i < foo.length; i++) {
        var interval = {
          "start": +elation.utils.arrayget(foo[i], "_children.timePeriod._children.start._content"),
          "duration": +elation.utils.arrayget(foo[i], "_children.timePeriod._children.duration._content"),
          "value": +elation.utils.arrayget(foo[i], "_children.value._content"),
          "cost": +elation.utils.arrayget(foo[i], "_children.cost._content") / 100000
        };
        interval["end"] = interval["start"] + interval["duration"];
        interval["costpersecond"] = interval["cost"] / interval["duration"];
        interval["costperminute"] = interval["costpersecond"] * 60;
        interval["costperhour"] = interval["costperminute"] * 60;
        interval["costperday"] = interval["costperhour"] * 24;
        interval["time"] = new Date(interval["start"] * 1000);
        interval["usagepersecond"] = interval["value"] / interval["duration"];
        interval["usageperminute"] = interval["usagepersecond"] * 60;
        interval["usageperhour"] = interval["usageperminute"] * 60;
        interval["usageperday"] = interval["usageperhour"] * 24;
        intervals.push(interval);
      }
      this.data[m[1]] = intervals;
      this.add(m[1], intervals, this.graphtype);
    }
    this.setrange();
    this.setscale();
    //this.updatebrush();
  }
  this.onbrush = function() {
    if (!this.brushtimer) {
      this.brushtimer = setTimeout(elation.bind(this, function() {
        this.setrange(this.brush.empty() ? this.x2.domain() : this.brush.extent());
        this.brushtimer = false;
      }), 1000/60);
    }
  }
  this.ui_select_change = function(ev) {
    this.graphtype = ev.target.value;
    this.focus.select(".y.label")
      .text(this.labels[this.graphtype]);
    this.ydomain = [0, 0];
    var range = this.x.domain();
    for (var k in this.data) {
      this.add(k, this.data[k], this.graphtype);
    }
    this.setrange(range, true);
    //document.location = "/smartmeter?graphtype=" + ev.target.value; 
  }
  this.ui_droptarget_drop = function(ev) {
    console.log('doop', ev);
    if (ev.data.files && ev.data.files.length > 0) {
      for (var i = 0; i < ev.data.files.length; i++) {
        var file = ev.data.files[i];
        if (file.type == 'application/zip') {
          var freader = new FileReader();
          elation.events.add(freader, "load", elation.bind(this, function(ev) {
            this.loadzip(ev.currentTarget.result);
          }));
          freader.readAsBinaryString(file);
        }
      }
    }
    
  }
}, elation.ui.droptarget);
