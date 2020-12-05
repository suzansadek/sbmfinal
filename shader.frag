#version 100
/* precision mediump float; */
precision highp float;
/* #ifdef GL_ES
  precision highp float;
  precision mediump int;
#endif */

//diffusion
/* #define FRAG_CLAMP 1
uniform vec2 wh_rcp;
uniform sampler2D tex;

#define STEPS 7
uniform vec3 PALLETTE[STEPS]; */

/* vec2 outfrag; */
/*
uniform float dA  ;
uniform float dB  ;
uniform float feed;
uniform float kill;
uniform float dt  ; */

// eyes
varying vec2 uv;
uniform float frameCount;
uniform float toggleCheck;
uniform vec2 mouse;
uniform vec2 resolution;
uniform sampler2D cam;
// grab texcoords from vert shader
// varying vec2 fragCoord;
// uniform vec2 leftEye;

#define thick   0.04
#define smooth  (16.0 / resolution.x)
#define PI      3.1415926535
#define S(x) smoothstep(-smooth, smooth, x)
#define SR(x, y) smoothstep(-smooth * y, smooth * y, x)
#define scalex 5.
#define scaley 5.
#define scx (scalex * PI * 2.)

//Palettes by Inigo Quilez http://www.iquilezles.org/www/articles/palettes/palettes.htm
vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.28318*(c*t+d) );
}

vec3 pal1(in float t){
    return pal(t, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.0,0.33,0.67)) ;
}

float rand(vec3 v){
    return fract(cos(dot(v,vec3(13.46543,67.1132,123.546123)))*43758.5453);
}

float rand(vec2 v){
    return fract(sin(dot(v,vec2(5.11543,71.3177)))*43758.5453);
}

float rand(float v){
    return fract(sin(v * 71.3132)*43758.5453);
}

vec2 rand2(vec2 v){
    return vec2(
        fract(sin(dot(v,vec2(5.11543,71.3132)))*43758.5453),
        fract(sin(dot(v,vec2(7.3113,21.5723)))*31222.1234)
        );
}
vec2 rotate(vec2 st, float angle){
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c) * st;
}
float smrand(float v){
    float vv = floor(v);
    return mix(rand(vv),rand(vv+1.0),fract(v));
}

vec3 eye(vec2 fst, vec2 cst, vec2 mouse){
    float mouseDown = clamp(1.0, 0.0, 1.0);
    float noise = rand(cst);

    float nt = frameCount*0.02 * (noise + 0.8 ) +noise * 100.0;
    float fnt = floor(nt);
    vec2 noise2 = rand2(cst + vec2(fnt));
    vec2 noise22 = rand2(cst + vec2(fnt + 1.));
    float pinoise = noise2.x * PI * 2.0;
    float pinoise2 = noise22.x * PI * 2.0;
    float move = 1.0 - (cos(fract(nt)*PI)+1.0) /2.0;
    move = pow(move,4.0);

    float eyeOpen = (sin(frameCount*0.2 + noise * 100.0) + 1.0) / 2.0;
    eyeOpen = mix(eyeOpen,0.0, mouseDown);
    eyeOpen = 1.0 - pow(eyeOpen, 3.0);

    float col = (sin(fst.x) + 1.)/2.0;
    //col = pow(col,0.9);
    float col2 = col* eyeOpen + fst.y*2.1 - 0.1;
    col = col* eyeOpen - fst.y*2.1 - 0.1;
    float cs1 = min(col - 0.1, col2- 0.1);
    float cs2 = S(cs1);
    col = S(min(col, col2));

    float grad = min(eyeOpen * 1.2, 1.);
    //float grad = min(1.0 - pow(1.0 -abs(fst.y),10.) + 0.3,1.0);

    vec2 loc = vec2(fract(fst.x/PI/2.0 + PI*2.0) - 0.53,fst.y*resolution.y/resolution.x);

    vec2 pin2 = mix(vec2(cos(pinoise),sin(pinoise))*((noise2.y +1.0) / 2.0),
                    vec2(cos(pinoise2),sin(pinoise2))*((noise22.y +1.0) / 2.0),move);
    pin2 *= 0.25;
    pin2 =  mix(pin2, mouse, max(mouseDown - 0.05,0.));

    float lloc = length(loc);
    float irisn = mix(1.0,mix(noise2.x, noise22.x, move),0.25);
    float iris = length(loc - pin2 * (0.5 -lloc) );
    float irisWhite = length(loc - pin2 * (0.2 -lloc) );
    float irisDark = SR(length(loc - pin2 * (0.4 -lloc) ) - 0.05 * irisn,0.5);
    float irisShadow = SR(-irisWhite + 0.07,15.);
    irisWhite = SR(-irisWhite + 0.03,1.4);

    vec3 irisColor = irisDark *pal1( irisShadow + nt/10.0);
    irisColor = max(irisColor, irisWhite*0.9);
    vec3 baseCol = vec3(SR(-lloc+ .25,15.));
    baseCol = baseCol + 0.25*pal1( baseCol.x + nt/10.0);

    vec3 finCol = mix(baseCol, irisColor, S(-iris + 0.15));
    finCol = mix(pal1(noise + nt/10.0) * grad,finCol, cs2);
    finCol = min(finCol, col);

    return finCol;
}

/* vec3 getShading(float val){
  val = clamp(val, 0.0, 0.99999);
  float lum_steps = val * float(STEPS-1);
  float frac = fract(lum_steps);
  int id = int(floor(lum_steps));
  // array-access in webgl 1 sucks!
  if(id == 0) return mix(PALLETTE[0], PALLETTE[1], frac);
  if(id == 1) return mix(PALLETTE[1], PALLETTE[2], frac);
  if(id == 2) return mix(PALLETTE[2], PALLETTE[3], frac);
  if(id == 3) return mix(PALLETTE[3], PALLETTE[4], frac);
  if(id == 4) return mix(PALLETTE[4], PALLETTE[5], frac);
  if(id == 5) return mix(PALLETTE[5], PALLETTE[6], frac);
  return PALLETTE[6];
} */

void main() {
  vec2 pos = gl_FragCoord.xy/resolution;

  vec2 mouse = (mouse.xy)/ resolution.xy;
	pos.x = pos.x + sin(pos.y*20.+frameCount*0.02)*0.05;

  //Diffusion
  /* vec2 posn = gl_FragCoord.xy * wh_rcp;
  vec2 val = texture2D(tex, posn).rg;
  vec2 lap = -val;

  lap += texture2D(tex, posn + vec2(-1, 0) * wh_rcp).rg * 0.20;
  lap += texture2D(tex, posn + vec2(+1, 0) * wh_rcp).rg * 0.20;
  lap += texture2D(tex, posn + vec2( 0,-1) * wh_rcp).rg * 0.20;
  lap += texture2D(tex, posn + vec2( 0,+1) * wh_rcp).rg * 0.20;
  lap += texture2D(tex, posn + vec2(-1,-1) * wh_rcp).rg * 0.05;
  lap += texture2D(tex, posn + vec2(+1,-1) * wh_rcp).rg * 0.05;
  lap += texture2D(tex, posn + vec2(-1,+1) * wh_rcp).rg * 0.05;
  lap += texture2D(tex, posn + vec2(+1,+1) * wh_rcp).rg * 0.05;

  float nA = dA * lap.r - val.r * val.g * val.g + feed * (1.0 - val.r);
  float nB = dB * lap.g + val.r * val.g * val.g - (feed + kill) * val.g;

  outfrag = val + vec2(nA, nB) * dt;

  #if FRAG_CLAMP
    outfrag = clamp(outfrag, vec2(0.0), vec2(1.0));
  #endif */

//eyes
  vec2 st = (gl_FragCoord.xy)/ resolution.xy;
  float fsty = fract(st.y * scaley) - 0.5;
  float fsty2 = fract(st.y * scaley  + 0.5) - 0.5;
  float csty = floor(st.y * scaley);
  float csty2 = floor(st.y * scaley + 0.5);
  float cstx = floor(st.x * scalex);
  float cstx2 = floor(st.x * scalex + 0.5);
  vec2 cst = vec2(cstx,csty);
  vec2 cst2 = vec2(cstx2,csty2 + 1234.);
  vec2 fst = vec2(st.x * scx - 0.5 * PI, fsty);
  vec2 fst2 = vec2(st.x * scx + 0.5 * PI, fsty2);


  vec2 m1 = mouse - vec2((cstx + 0.5)/scalex, (csty + 0.5)/scaley);
  vec2 m2 = mouse - vec2((cstx2 + 0.5)/scalex, (csty2 + 0.5)/scaley);

  vec3 col = eye(fst, cst, m1);
  vec3 col2 = eye(fst2, cst2, m2);
  col = max(col,col2);
  col += 0.1 * (rand(gl_FragCoord.xy/3.0 + frameCount*0.02)-0.5);
  /* vec2 val = texture2D(tex, gl_FragCoord.xy * wh_rcp).rg; */
  //col -= 0.1 * (rand(fragCoord.xy/3.0 + iTime + 100.0));

  if (toggleCheck ==0.0){
    //sin
    gl_FragColor = texture2D(cam, 1.-pos);
  } else if (toggleCheck==1.0){
    //eyes
    gl_FragColor = vec4(col, 1.0);
  }
  /* else if (toggleCheck == 2.0){
    gl_FragColor = vec4(getShading(val.r*val.r), 1.0);
    gl_FragColor = vec4(outfrag, 0.0, 1.0);
  } */
}
