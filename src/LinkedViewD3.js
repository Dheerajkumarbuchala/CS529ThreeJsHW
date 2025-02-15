import React, {useEffect, useRef} from 'react';
import useSVGCanvas from './useSVGCanvas.js';
import * as d3 from 'd3';


//TODO: modify this to make a new glyph that captures both the in-plane velocity and concentration
//example function/code for making a custom glyph
//d is the data point {position, velocity,concentration}, axis is ['x','y','z'], scale is optional value to pass to help scale the object size
function makeVelocityGlyph(d,axis,scale=1){
    var xv = d.velocity[1];
    var yv = d.velocity[2];
    if(axis == 'y'){
        xv = d.velocity[0];
        yv =  d.velocity[1];
    } else if(axis == 'z'){
        xv = d.velocity[0];
    }

    let xpos = xv/scale
    let ypos = yv/scale
    let path = 'M ' + xpos + ',' + ypos + ' '
        + -ypos/3 + ',' + xpos/3 + ' '
        + ypos/3 + ',' + -xpos/3 + 'z'
    return path;
}

function makeVelocityConcentrationGlyph(d, axis, scale=1){
    var xv = d.velocity[1];
    var yv = d.velocity[2];
    if(axis == 'y'){
        xv = d.velocity[0];
        yv =  d.velocity[1];
    } else if(axis == 'z'){
        xv = d.velocity[0];
    }
    // Extracting the concentration for further reference
    let conc = d.concentration
    let xpos = xv/scale
    let ypos = yv/scale

    let path = 'M ' + xpos + ',' + ypos + ' '
        + -ypos/3 + ',' + xpos/3 + ' '
        + ypos/3 + ',' + -xpos/3 + 'z'

    // I wnat to include a circle, so I am making x and y as same so that the arc length will be same on the both sides and forms a circle.
    let x = conc * 0.03
    let y = conc * 0.03    
        
    let path2 = 'M ' + xpos + ',' + ypos + ' '
        + 'A ' + x + ',' + y + ' 0 1,1 ' + xpos + ',' + (ypos + 0.01) + 'Z';

    //return path;
    //return path2;
    return path + path2;
}

export default function LinkedViewD3(props){
    //this is a generic component for plotting a d3 plot
    const d3Container = useRef(null);
    const [svg, height, width, tTip] = useSVGCanvas(d3Container);
    console.log("Props Data: ", props.data)
    const margin = 10;
    //sets a number of the number of particles we show when the brushed area has is too large
    const maxDots = 2000;
    
    //draw the points in the brushed area
    useEffect(()=>{
        if(svg !== undefined & props.data !== undefined & props.bounds !== undefined){
            //filter data by particles in the brushed region
            const bDist = d => props.brushedCoord - props.getBrushedCoord(d);
            function isBrushed(d){
                return Math.abs(bDist(d)) < props.brushedAreaThickness;
            }
            var data = props.data.filter(isBrushed);

            const bounds = props.bounds;
            console.log('bounds',bounds)
            var xExtents = [bounds.minZ, bounds.maxZ];
            var yExtents = [bounds.minY, bounds.maxY];
            if(props.brushedAxis === 'y'){
                xExtents = [bounds.minX, bounds.maxX];
                yExtents = [bounds.minZ, bounds.maxZ];
            } else if(props.brushedAxis === 'z'){
                xExtents = [bounds.minX, bounds.maxX];
            }

            var getX = d => d.position[1];
            var getY = d => d.position[2];
            if(props.brushedAxis == 'y'){
                getX = d => d.position[0];
                getY = d => d.position[1];
            } else if(props.brushedAxis == 'z'){
                getX = d => d.position[0];
            }

            //TODO: filter out points with a concentration of less than 80% of the maximum value of the current filtered datapoints
            console.log("Props Data : ", props.data)
            var concentrationData = props.data.map(item => item.concentration)
            console.log("Concentration Data : ", concentrationData)
            var minConcentration = d3.min(concentrationData)
            var maxConcentration = d3.max(concentrationData)
            console.log("Min Concentration : ", minConcentration)
            console.log("Max Concentration : ", maxConcentration)
            var filteredData1 = []
            for(let c in concentrationData){
                if (c < (0.7 * maxConcentration)){
                    filteredData1.push(c)
                }
            }
            console.log("Filtered Data - 1 : ", filteredData1)
            var filteredData = []
            for (let item of props.data){
                if(item.concentration < (0.7 * maxConcentration)){
                    console.log("Item : ", item)
                    filteredData.push(item)
                }
            }
            console.log("Filtered Data - 2 : ", filteredData1)

            data = data.filter((obj) => obj.concentration >= 0.3* maxConcentration)
            console.log("new data : ", data)

            //limit the data to a maximum size to prevent occlusion
            data.sort((a,b) => bDist(a) - bDist(b));
            if(data.length > maxDots){
                data = data.slice(0,maxDots);
            }

            const getVelocityMagnitude = d => Math.sqrt(d.velocity[0]**2 + d.velocity[1]**2 + d.velocity[2]**2);
            const vMax = d3.max(data,getVelocityMagnitude);
            
            //custom radius based on number of particles
            const radius = Math.max(3*Math.min(width,height)/data.length,5);

            //scale the data by the x and z positions
            let xScale = d3.scaleLinear()
                .domain(xExtents)
                .range([margin+radius,width-margin-radius])

            let yScale = d3.scaleLinear()
                .domain(yExtents)
                .range([height-margin-radius,margin+radius])

            // let colorScale = d3.scaleLinear()
            //     .domain(yExtents)
            //     .range(props.colorRange);

            let colorScale = d3.scaleLinear()
                .domain([minConcentration, maxConcentration])
                .range(props.colorRange);

            //TODO: map the color of the glyph to the particle concentration instead of the particle height
            let dots = svg.selectAll('.glyph').data(data,d=>d.id)
            dots.enter().append('path')
                .attr('class','glyph')
                .merge(dots)
                .transition(100)
                .attr('d', d => makeVelocityConcentrationGlyph(d,props.brushedAxis,.25*vMax/radius))
                .attr('fill',d=>colorScale(d.concentration))
                .attr('stroke','black')
                .attr('stroke-width',.1)
                .attr('transform',d=>'translate(' + xScale(getX(d)) + ',' + yScale(getY(d)) + ')');

            dots.exit().remove()
        }
    },[svg,props.data,props.getBrushedCoord,props.bounds])

    
    return (
        <div
            className={"d3-component"}
            style={{'height':'99%','width':'99%'}}
            ref={d3Container}
        ></div>
    );
}
