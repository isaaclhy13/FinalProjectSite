const {
    tidy,
    filter,
    groupBy,
    summarize,
    n,
    mutate
} = Tidy;

// Set graph margins and dimensions
var margin = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 60
    },
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    slider_height = 150 - margin.top - margin.bottom;

// Set ranges
var x = d3.scaleBand()
    .range([0, width])
    .padding(0.1);
var y = d3.scaleLinear()
    .range([height, 0]);



// slider
var startDate = new Date("2009"),
    endDate = new Date("2017");

AQI_breaks = [12.0, 35.5, 55.5, 150.5, 250.5];
AQI_colors = ["#00E400", "#FFFF00", "#FF7E00", "#FF0000", "#8F3F97", "#7E0023"];
YlOrRd_colors = ['#ffffb2', '#fed976', '#feb24c', '#fd8d3c', '#f03b20', '#bd0026']
color_scale = YlOrRd_colors;



var parseDate = d3.timeParse("%Y");

var formatDay = d3.timeFormat("%Y");
var formatMonthDate = d3.timeFormat("%Y");
var formatDate = d3.timeFormat("%Y");

// Define scales -------------------------------------------------------------
d3.csv("tidy.csv").then(function(raw) {
    var data_year = tidy(
        raw,
        filter((d) => d.Year == 2009),
    )

    var data = tidy(
        data_year,
        filter((d) => d.Gender != ""),
        groupBy('Gender', [
            summarize({
                count: n()
            })
        ])
    )
    var currentGroup = "Gender";
    // For the slider
    var xt = d3.scaleTime()
        .domain([startDate, endDate])
        .range([0, width])
        .clamp(true);

    // Create tooltip ------------------------------------------------------------

    var div = d3.select('#vis').append('div')
        .attr('class', 'tooltip')
        .style('display', 'none');

    function mouseover() {
        div.style('display', 'inline');
    }

    function mousemove() {
        var d = d3.select(this).data()[0]
        div
            .html("pm 2.5" + '<hr/>' + d.pm25)
            .style('left', (d3.event.pageX - 34) + 'px')
            .style('top', (d3.event.pageY - 12) + 'px');
    }

    function mouseout() {
        div.style('display', 'none');
    }


    // Create slider -------------------------------------------------------------

    var svgSlider = d3.select("#slider")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", slider_height);

    var slider = svgSlider.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + margin.left + "," + slider_height / 2 + ")");

    // Draw slider ---------------------------------------------------------------

    slider.append("line")
        .attr("class", "track")
        .attr("x1", xt.range()[0])
        .attr("x2", xt.range()[1])
        .select(function() {
            return this.parentNode.appendChild(this.cloneNode(true));
        })
        .attr("class", "track-inset")
        .select(function() {
            return this.parentNode.appendChild(this.cloneNode(true));
        })
        .attr("class", "track-overlay")
        .call(d3.drag()
            .on("start.interrupt", function() {
                slider.interrupt();
            })
            .on("start drag", function() {
                update(xt.invert(event.x));
            }));

    slider.insert("g", ".track-overlay")
        .attr("class", "ticks")
        .attr("transform", "translate(0," + 18 + ")")
        .selectAll("text")
        .data(xt.ticks(10))
        .enter()
        .append("text")
        .attr("x", xt)
        .attr("text-anchor", "middle")
        .text(function(d) {
            return formatMonthDate(d);
        });

    var handle = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 9);

    var label = slider.append("text")
        .attr("class", "label")
        .attr("text-anchor", "middle")
        .text(formatMonthDate(startDate))
        .attr("transform", "translate(0," + (-25) + ")")

    // Update slider -------------------------------------------------------------

    function update(h) {

        // update position and text of label according to slider scale
        handle.attr("cx", xt(h));
        label
            .attr("x", xt(h))
            .text(formatMonthDate(h));

        //update the year of data we are working with
        data_year = tidy(
            raw,
            filter((d) => d.Year == formatMonthDate(h)),
        );
        redraw(currentGroup);



    }

    function redraw(selectedGroup) {
        svg.selectAll("*").remove();



        if (selectedGroup == 'Gender') {
            currentGroup = 'Gender';
            var dataFilter = tidy(
                data_year,
                filter((d) => d.Gender != ""),
                groupBy('Gender', [
                    summarize({
                        count: n()
                    })
                ])
            )

            x.domain(dataFilter.map(function(d) {
                return d.Gender;
            }));
            y.domain([0, d3.max(dataFilter, function(d) {
                return d.count;
            })]);

            // Append rectangles for bar chart
            svg.selectAll(".bar")
                .data(dataFilter)
                .enter().append("rect")
                .attr("class", "bar")
                .transition().duration(1000)
                .attr("x", function(d) {
                    return x(d.Gender);
                })
                .attr("width", x.bandwidth())
                .attr("y", function(d) {
                    return y(d.count);
                })
                .attr("height", function(d) {
                    return height - y(d.count);
                });

            // Add x axis
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x));

            // Add y axis
            svg.append("g")
                .call(d3.axisLeft(y));
        }

        if (selectedGroup == 'Race') {
            currentGroup = 'Race';
            var dataFilter = tidy(
                data_year,
                filter((d) => d.Race != ""),
                groupBy('Race', [
                    summarize({
                        count: n()
                    })
                ])
            )

            x.domain(dataFilter.map(function(d) {
                return d.Race;
            }));
            y.domain([0, d3.max(dataFilter, function(d) {
                return d.count;
            })]);

            // Append rectangles for bar chart
            svg.selectAll(".bar")
                .data(dataFilter)
                .enter().append("rect")
                .transition().duration(1000)
                .attr("class", "bar")
                .attr("x", function(d) {
                    return x(d.Race);
                })
                .attr("width", x.bandwidth())
                .attr("y", function(d) {
                    return y(d.count);
                })
                .attr("height", function(d) {
                    return height - y(d.count);
                });

            // Add x axis
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x));

            // Add y axis
            svg.append("g")
                .call(d3.axisLeft(y));
        }

    }


    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")")



    var allGroup = ["Gender", "Race"];
    d3.select("#selectButton")
        .selectAll('myOptions')
        .data(allGroup)
        .enter()
        .append('option')
        .text(function(d) {
            return d;
        })
        .attr("value", function(d) {
            return d;
        })

    // Format
    data.forEach(function(d) {
        d.count = +d.count;
    });

    x.domain(data.map(function(d) {
        return d.Gender;
    }));
    y.domain([0, d3.max(data, function(d) {
        return d.count;
    })]);

    // Append rectangles for bar chart
    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) {
            return x(d.Gender);
        })
        .attr("width", x.bandwidth())
        .attr("y", function(d) {
            return y(d.count);
        })
        .attr("height", function(d) {
            return height - y(d.count);
        });

    // Add x axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add y axis
    svg.append("g")
        .call(d3.axisLeft(y));



    // When the button is changed, run the updateChart function
    d3.select("#selectButton").on("change", function(d) {
        // recover the option that has been chosen
        var selectedOption = d3.select(this).property("value")
        // run the updateChart function with this selected option
        redraw(selectedOption)
    })

})