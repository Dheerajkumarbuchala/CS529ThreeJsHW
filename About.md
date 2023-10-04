Changed the code of colorscale such that the scale will be mapped to the concentration.
For that I extracted minimum concentration and maximum concentration, and the list containing the min and max concentrations are passed to the colorscale. So, that the colorscale will be mapped to the concentration.

In the following task I extracted the points with a threshold of 0.7. As I already know the max Concentration, the extraction was easy.

In the following task, I added a custom glyph, i.e makeVelocityConcentrationGlyph. In which I added the path which forms circles in the 2d representation. I added the path such that the cirlce appends to the arrow at the tip (just for clarity). And the radius of the circle is mapped to the concentration of the particle(d).