var margin = {top: 40, right: 40, bottom: 40, left: 40};

var svgGraph = d3.select("#graph"),
    width = svgGraph.node().getBoundingClientRect().width - margin.left - margin.right,
    height = svgGraph.node().getBoundingClientRect().height - margin.top - margin.bottom;

d3.tsv("data/verbenListe.txt", function(error, data) {
    if (error) throw error;

    var hintergrund = svgGraph.append("g");

    hintergrund.append("rect")
        .attr("width", width+ margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("fill", "#ece2f0");

    hintergrund.append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", width)
        .attr("height", height)
        .style("stroke","black")
        .style("stroke-width", "3")
        .style("fill", "#00f0");

    // 4 bucktabe mit 32vw ist genug gross
    // 3 bucktabe mit 50vw ist zu gross
    // 2 bucktabe mit 65vw ist zu gross

    praeposition = hintergrund.append("text")
        .attr("x", width/2)
        .attr("y", 3*height/4)
        .attr("text-anchor", "middle")
        .attr("font-size", "32vw")
        .style("fill", "#a6bddb")
        .style("opacity", 1);

    var tree = d3.nest()
        .key(function(d) { return d.Präposition; })
        .map(data);

    console.log(tree)

    //praepositionenArr = tree.map(function(d){ return d.key})
    praepositionenArr = tree.keys();

    // Wahl ein präposition
    var gewaehltPraep = Math.random() * praepositionenArr.length | 0;
    praeposition.text(praepositionenArr[gewaehltPraep]);

    // Add circles
    var nummerWorteBild = 6;
    var prozentRichtig = 0.4;

    // die worte wählen
    var richtigeWorteListe = tree["$"+praepositionenArr[gewaehltPraep]].map(function(d){return d});
    var richtigeWorte = getRandomSubarray(richtigeWorteListe, Math.floor(nummerWorteBild*prozentRichtig));
    var worteListe = data.map(function(d){ return d});
    var falscheWorteList = diff(worteListe, richtigeWorteListe);

    console.log(worteListe)
    console.log(richtigeWorteListe)
    console.log("oeoeo")
    console.log(falscheWorteList)
    var falscheWorte = getRandomSubarray(falscheWorteList, Math.ceil(nummerWorteBild*(1-prozentRichtig)));

    worteListe = richtigeWorte.map(function(d){ return {wort: d.Verb, type: "R", beispiel: d.Beispiel, kasus: d.Kasus}});
    worteListe = worteListe.concat(falscheWorte.map(function(d){ return {wort: d.Verb, type: "F", beispiel: d.Beispiel, kasus: d.Kasus}}));
    console.log(worteListe);

    worteListe = shuffle(worteListe);

    // die Punkt Zaehler
    var aktuelleGefunden = 0;
    var insgesamt = falscheWorte.length;
    var fehler = 0;

    var gZaehler = svgGraph.append("g");
    gZaehler.append("text")
        .attr("id", "Punktzahl")
        .attr("x", width)
        .attr("y", height)
        .attr("font-size", "8vw")
        .attr("text-anchor", "end")
        .style("fill", "#a6bddb")
        .text(aktuelleGefunden +"/" + insgesamt)

    var gFehlerZaehler = svgGraph.append("g");
    gFehlerZaehler.append("text")
        .attr("id", "Fehlerzahl")
        .attr("x", 0)
        .attr("y", height)
        .attr("dx","1em")
        .attr("font-size", "8vw")
        .style("fill", "#a6bddb")
        .attr("text-anchor", "end")
        .text(fehler);

    var x = d3.scaleLinear()
        .range([0, width])
        .domain([0,1]);

    var y = d3.scaleLinear()
        .range([0, height])
        .domain([0,1]);

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    var gWorte = svgGraph.append("g")
        .selectAll("g")
        .data(worteListe);

    gWorteEnter = gWorte.enter()
        .append("g")
        .attr("class",function(d,i){return "g "+i;})
/*
        .attr("transform", function(d,i){
            // Upper elipse
            var xPos = 0.5 - Math.cos(i/10*Math.PI)/2.5;
            var yPos = 0.5 - Math.sin(i/10*Math.PI)/2.5;
            return "translate(" + x(xPos) + "," + y(yPos) + ")"
        })
*/
        .on("click", function(d){
            if(d.type == "F"){
                d3.select(this).transition()
                    .duration(500)
                    .ease(d3.easeLinear)
                    .style("opacity", 0)
                    .remove();
                aktuelleGefunden += 1;
                d3.select("#Punktzahl")
                    .text(aktuelleGefunden+"/"+insgesamt);

                var siegZiehen = svgGraph.append("text")
                    .attr("fill", "#3c763d")
                    .attr("class","far")
                    .attr("font-size", "8vw")
                    .attr("dy", "-1em")
                    .attr("dx", "-1em")
                    .attr("x", width)
                    .attr("y", height)
                    .text("\uf118");

                siegZiehen.transition()
                    .duration(1000)
                    .ease(d3.easeLinear)
                    .style("opacity", 0)
                    .attr("transform", "translate(0,"+(-height/2)+")")
                    .remove();

                worteListe  = worteListe.filter(worte => worte.wort != d.wort);
                simulation.nodes(worteListe);
                simulation.force("repulsion").strength(simulation.force("repulsion").strength()-100);
                simulation.restart();

                if(aktuelleGefunden == insgesamt){
                    level1Beendet();
                }

            }if(d.type == "R"){
                fehler += 1;
                d3.select(this).transition()
                    .duration(80)
                    .attr("transform", "translate(8)")
                    .transition()
                    .duration(80)
                    .attr("transform", "translate(0)");
                d3.select("#Fehlerzahl")
                    .text(fehler);

                // Trauriges Gesicht
                var fehelerZiehen = svgGraph.append("text")
                    .attr("fill", "#a94442")
                    .attr("class","far")
                    .attr("font-size", "8vw")
                    .attr("dy", "-1em")
                    .attr("dx", "1em")
                    .attr("x", 0)
                    .attr("y", height)
                    .text("\uf119");

                fehelerZiehen.transition()
                    .duration(2000)
                    .ease(d3.easeLinear)
                    .style("opacity", 0)
                    .attr("transform", "translate(0,"+(-height/2)+")")
                    .remove();

                if(!d3.select("#zBLevel1").empty()){
                    d3.select("#zBLevel1").remove()
                }

                // Zeihgen Beispiel
                var beispiel = svgGraph.append("text")
                    .attr("fill", "#a94442")
                    .attr("id", "zBLevel1")
                    .attr("font-size", "3vw")
                    .attr("x", (width+margin.right+margin.left)/2)
                    .attr("text-anchor", "middle")
                    .attr("y", height)
                    .text("z.B."+ d.beispiel);

                beispiel.transition()
                    .duration(8000)
                    .ease(d3.easeLinear)
                    .style("opacity", 0)
                    .remove();

                simulation.restart();
            }
        });

    gWorteEnter.append("circle")
        .attr("r",60)
        .attr("class",function(d,i){return "circle "+i;})
        .style("fill", "#1c9099")
        .style("opacity", 0.7);

    gWorteEnter.append("text")
        .attr("text-anchor", "middle")
        .text(function(d){return d.wort.replace(/sich|\(sich\)/g, "");})
        .style("font-family", "'Roboto', sans-serif")
        .attr("font-size", "1.5vw")
        .style("font-weight", "bold")
        .attr("fill", "black");

    gWorteEnter.append("text")
        .attr("text-anchor", "middle")
        .text(function(d){
            if(d.wort.includes("(sich)")){return "(sich)";}
            if(d.wort.includes("sich")){return "sich";}
            return "";})
        .style("font-family", "'Roboto', sans-serif")
        .attr("font-size", "1.5vw")
        .style("font-weight", "bold")
        .attr("dy", "-1em")
        .attr("fill", "black")

    var ticked = function() {
        /*aktualisieren die Simulation*/
        gWorteEnter.selectAll("circle")
            .attr("cx", function(d) { return d.x = Math.max(60+margin.left, Math.min(width - margin.right - 120, d.x)); })
            .attr("cy", function(d) { return d.y = Math.max(60+margin.top, Math.min(height - margin.bottom - 120, d.y)); });

        gWorteEnter.selectAll("text")
            .attr("x", function(d) { return d.x })
            .attr("y", function(d) { return d.y });
    };

    var simulation = d3.forceSimulation(worteListe)
        .force("x", d3.forceX(x(0.5)).strength(0.05))
        .force("y", d3.forceY(y(0.5)).strength(0.05))
        .force("collide", d3.forceCollide(60))
        .force("repulsion",d3.forceManyBody().strength(-1300))
        .on("tick",ticked);

    var level1Beendet = function(){

        praeposition.remove();
        gWorteEnter.remove();

        var gEndLevel = svgGraph.append("g");
        var titel = gEndLevel.append("text")
            .attr("id", "wahlTexte")
            .attr("x", width/2)
            .attr("y", height/4)
            .attr("font-size", "6vw")
            .attr("text-anchor", "middle")
            .style("fill", "black")
            .text("Du hast das Level beendet!");

        var nochmal = gEndLevel.append("text")
            .attr("fill", "black")
            .attr("class","fas")
            .attr("font-size", "8vw")
            .attr("x", width/6)
            .attr("y", 2*height/3)
            .text("\uf01e");

        var naechste = gEndLevel.append("text")
            .attr("fill", "black")
            .attr("class","fas")
            .attr("font-size", "8vw")
            .attr("x", 5*width/6)
            .attr("y", 2*height/3)
            .text("\uf061");

        var beispiel = svgGraph.append("text")
            .attr("id", "zBLevel1")
            .attr("font-size", "3vw")
            .style("font-family", "'Roboto', sans-serif")
            .attr("x", (width+margin.right+margin.left)/2)
            .attr("text-anchor", "middle")
            .style("opacity", 0.5)
            .attr("y", height)
            .text("Klick auf ein Verb, um eine Beispiel zu zeigen");

        var gWorte = gEndLevel.selectAll("text.worte")
            .data(richtigeWorte).enter()
            .append("text")
            .attr("class", "worte far")
            .attr("font-size", "3vw")
            .style("font-family", "'Roboto', sans-serif")
            .attr("text-anchor", "middle")
            .attr("dy", function(d,i){return "-"+2*i+"em"})
            .attr("x", (width+margin.right)/2)
            .attr("y", height/2)
            .text(function(d){return d.Verb +" "+ praepositionenArr[gewaehltPraep]+" + "+d.Kasus})
            .on("click", function (d) {
                beispiel.text("z.B."+ d.Beispiel)
                    .style("opacity", 1);
            });

    }

});