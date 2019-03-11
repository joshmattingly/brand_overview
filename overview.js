// Product filter based on Jurian's filter values with checkboxes:
// bl.ocks.org/jurb/5d42c6de467d7a71b2fc855e6aa3157f

var margin = { top: 80, right: 50, bottom: 90, left: 150};
var width = 1600 - margin.left - margin.right;
var height = 750 - margin.top - margin.bottom;

var commaFormat = d3.format(",.0f"),
    percentFormat = d3.format(".0%");

var svg = d3.select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

tip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-20, 20])
    .html(function(d){
        return "<span id='tooltip'><strong>Brand: </strong>" + d.Brand + "<br>" +
            "<strong>Product: </strong>" + d.ITEM_DSCR + "<br>" +
            "<strong>YTD (2018): </strong>" + commaFormat(d['2018']) + "<br>" +
            "<strong>YTD (2019): </strong>" + commaFormat(d['2019']) + "<br>" +
            "<strong>% Chg: </strong>" + percentFormat(d.PctChg) + "</span>";
    });

d3.csv('YoYSummary.csv').then(function(dataset) {

    dataset.forEach(function (d) {
        d['2018'] = +d['2018'];
        d['2019'] = +d['2019'];
        d['PctChg'] = +d['PctChg'];
    });

    data = dataset;

    brandList = d3.map(data, function (d) {
        return d.Brand;
    }).keys()

    // create the checkboxes
    d3.select("#filter")
        .selectAll("input")
        .data(brandList)
        .enter()
        .append("label")
        .append("input")
        .attr("type", "checkbox")
        .attr("class", "filter-check")
        .attr("value", function(d) { return d;})
        .attr("id", function(d) { return d; });

    d3.selectAll("label")
        .data(brandList)
        .attr("class", "checkbox")
        .append("text")
        .text(function(d){ return d;});

    symbol = d3.symbol();
    drawChart(brandList)
});

// updates the prod listing when a checkbox is selected
function drawChart(filter) {

    num_choices = filter.length;

    var checkBox = d3.selectAll(".filter-check")
        .on("change", function(){
            svg.select('.y-axis').remove();
            svg.select('.x-axis').remove();
            d3.select('.datapoints').remove();
            choices = [];
            var checkboxes = document.querySelectorAll('input[type=checkbox]:checked');
            for (var i = 0; i < checkboxes.length; i++) {
                choices.push(checkboxes[i].value);
            }
            drawChart(choices);
        })

    svg.call(tip)

    //filteredData = data.filter(function(d){ return filter.indexOf(d.Brand); })
    filteredData = data.filter(function(d){
        return filter.includes(d.Brand);
    })

    var unitsScale = d3.scaleSqrt()
        .domain([0, d3.max(filteredData, function (d) {
            if (d['2018'] < d['2019']) {
                return d['2019'];
            } else {
                return d['2018'];
            }
        })])
        .range([0, width]);

    brandScale = d3.scaleBand()
        .domain(filter)
        .rangeRound([0, height]);


    var xAxis = d3.axisBottom(unitsScale);
    var yAxis = d3.axisLeft(brandScale);

    // TODO: Add switch for spendScale

    // create the x axis
    svg.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("x", 3)
        .attr("text-anchor", "start");

    // create the y axis
    svg.append("g")
        .attr("class", "axis y-axis")
        .transition(500)
        .call(yAxis);

    svg.append("g")
        .attr("class", "datapoints")
        .selectAll(".points")
        .data(filteredData)
        .enter()
        .append("path")
        .attr("d", symbol.size(300/num_choices).type(function (d) {
            return d3.symbolTriangle;
        }))
        .attr("fill", function (d) {
            if (d['2018'] > d['2019']) {
                return "#E82C2A";
            } else if (d['2018'] < d['2019']) {
                return "#62BB46";
            } else {
                return "#007EC5";
            }
        })
        .attr("transform", function (d) {
            if (num_choices == 1) {
                increment = height / (num_choices + 1);
            } else {
                increment = height / (num_choices * 2);
            }

            if (d['2018'] > d['2019']) {
                return "translate(" + unitsScale(d['2019']) + ", " + (brandScale(d.Brand) + increment) + ") rotate(180)";
            } else if (d['2018'] < d['2019']) {
                return "translate(" + unitsScale(d['2019']) + ", " + (brandScale(d.Brand) + increment) + ")";
            } else {
                return "translate(" + unitsScale(d['2019']) + ", " + (brandScale(d.Brand) + increment) + ") rotate(90)";
            }
        })
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide)
        .append("text");
}

