uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;
uniform float iTime;
uniform vec4 iMouse;
uniform vec2 iResolution;
out vec4 C;
#define MAX_STEPS 200
#define MAX_DIST 150.
#define SURF_DIST .01
#define EPSILON .01
#define PI 3.14159265359
float dot2( in vec2 v ) { return dot(v,v); }
float dot2( in vec3 v ) { return dot(v,v); }
float ndot( in vec2 a, in vec2 b ) { return a.x*b.x - a.y*b.y; }

#define DEBUGMODE true


struct  Surface {
    float d;
    vec3 color;
    float Ka;
    float Kd;
    float Ks;
};
vec3 spaceship_color = vec3(0.3,0.5,1);

const vec3 COLOR_BACKGROUND = vec3(0.25, 0.2, 0.22);


mat4 trans (vec3 t)
{
    mat4 mat = mat4 (vec4 (1., .0, .0, .0),
                     vec4 (.0, 1., .0, .0),
                     vec4 (.0, .0, 1., .0),
                     vec4 (t.x, t.y, t.z, 1.));
    return mat;
}

mat4 rotX (in float angle)
{
    float rad = radians (angle);
    float c = cos (rad);
    float s = sin (rad);

    mat4 mat = mat4 (vec4 (1.0, 0.0, 0.0, 0.0),
                     vec4 (0.0,   c,   s, 0.0),
                     vec4 (0.0,  -s,   c, 0.0),
                     vec4 (0.0, 0.0, 0.0, 1.0));

    return mat;
}

mat4 rotY (in float angle)
{
    float rad = radians (angle);
    float c = cos (rad);
    float s = sin (rad);

    mat4 mat = mat4 (vec4 (  c, 0.0,  -s, 0.0),
                     vec4 (0.0, 1.0, 0.0, 0.0),
                     vec4 (  s, 0.0,   c, 0.0),
                     vec4 (0.0, 0.0, 0.0, 1.0));

    return mat;
}

mat4 rotZ (in float angle)
{
    float rad = radians (angle);
    float c = cos (rad);
    float s = sin (rad);

    mat4 mat = mat4 (vec4 (  c,   s, 0.0, 0.0),
                     vec4 ( -s,   c, 0.0, 0.0),
                     vec4 (0.0, 0.0, 1.0, 0.0),
                     vec4 (0.0, 0.0, 0.0, 1.0));

    return mat;
}

// Tarefa

//Operaçoes  de translação

// Operações de escala

vec3 opTransf (vec3 p, mat4 m)
{
    return vec4 (m * vec4 (p, 1.)).xyz;
}
float sphereDist(vec3 p, vec3 ce, float r)
{
    vec3 c = p-ce;
    float rn = r ;
    return (length(c)-rn);
}


float asteroidDist(vec3 p, vec3 center, float r, float seed)
{
    vec3 c = p - center;

    vec3 n = normalize(c);
    float x = n.x;
    float y = n.y;
    float z = n.z;


    float shape =
        0.10 * cos(5.0*x + seed) *
              sin(4.0*y + seed*0.7) +

        0.06 * cos(7.0*z + seed*0.3) *
              sin(5.0*x - seed);

    float detail =
        0.025 * sin(13.0*x + 3.0*y + seed) +
        0.020 * cos(11.0*z - 4.0*x + seed);

    float radius = r * (1.0 + shape + detail);

    return length(c) - radius;
}



float heartDist(vec3 p, vec3 ce, float r)
{

      vec3 c = p-ce;
      float rn = r ;
      c.z-=1.1-c.y*0.1;
      c.x=abs(c.x);
       c.y+=-c.x*sqrt((2.0-c.x)*0.5);
       rn+= 0.2*pow((0.5+0.5*sin(2.0*PI*iTime+c.y*1.1)),4.0);
       return (length(c)-rn);
}

float cylinderDist(vec3 p, vec3 ce,float r)
{
    vec2 c = (p-ce).xz;
    return (length(c)-r);
}

float planeDist(vec3 p, vec3 Normal,float D)
{
    return p.x*Normal.x + p.y*Normal.y + p.z*Normal.z -D;
}

float boxDist( vec3 p, vec3 b )
{
    vec3 d = abs(p) - b;
    return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}
float boxRoundDist(vec3 p, vec3 s, float r) {
    vec3 d = abs(p) - (s - r);
    return length(max(d, 0.0)) - r
        + min(max(d.x, max(d.y, d.z)), 0.0);
}


float boxFrameDist( vec3 p, vec3 b, float e )
{
       p = abs(p  )-b;
  vec3 q = abs(p+e)-e;

  return min(min(
      length(max(vec3(p.x,q.y,q.z),0.0))+min(max(p.x,max(q.y,q.z)),0.0),
      length(max(vec3(q.x,p.y,q.z),0.0))+min(max(q.x,max(p.y,q.z)),0.0)),
      length(max(vec3(q.x,q.y,p.z),0.0))+min(max(q.x,max(q.y,p.z)),0.0));
}
float ellipsoidDist( in vec3 p, in vec3 r ) // approximated
{
    float k0 = length(p/r);
    float k1 = length(p/(r*r));
    return k0*(k0-1.0)/k1;
}

float torusDist( vec3 p, vec2 t )
{
    return length( vec2(length(p.xz)-t.x,p.y) )-t.y;
}

float cappedTorusDist(in vec3 p, in vec2 sc, in float ra, in float rb)
{
    p.x = abs(p.x);
    float k = (sc.y*p.x>sc.x*p.y) ? dot(p.xy,sc) : length(p.xy);
    return sqrt( dot(p,p) + ra*ra - 2.0*ra*k ) - rb;
}

float hexPrismDist( vec3 p, vec2 h )
{
    vec3 q = abs(p);

    const vec3 k = vec3(-0.8660254, 0.5, 0.57735);
    p = abs(p);
    p.xy -= 2.0*min(dot(k.xy, p.xy), 0.0)*k.xy;
    vec2 d = vec2(
       length(p.xy - vec2(clamp(p.x, -k.z*h.x, k.z*h.x), h.x))*sign(p.y - h.x),
       p.z-h.y );
    return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}



float octogonPrismDist( in vec3 p, in float r, float h )
{
  const vec3 k = vec3(-0.9238795325,   // sqrt(2+sqrt(2))/2
                       0.3826834323,   // sqrt(2-sqrt(2))/2
                       0.4142135623 ); // sqrt(2)-1
  // reflections
  p = abs(p);
  p.xy -= 2.0*min(dot(vec2( k.x,k.y),p.xy),0.0)*vec2( k.x,k.y);
  p.xy -= 2.0*min(dot(vec2(-k.x,k.y),p.xy),0.0)*vec2(-k.x,k.y);
  // polygon side
  p.xy -= vec2(clamp(p.x, -k.z*r, k.z*r), r);
  vec2 d = vec2( length(p.xy)*sign(p.y), p.z-h );
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float capsuleDist( vec3 p, vec3 a, vec3 b, float r )
{
        vec3 pa = p-a, ba = b-a;
        float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
        return length( pa - ba*h ) - r;
}

float roundConeDist( in vec3 p, in float r1, float r2, float h )
{
    vec2 q = vec2( length(p.xz), p.y );

    float b = (r1-r2)/h;
    float a = sqrt(1.0-b*b);
    float k = dot(q,vec2(-b,a));

    if( k < 0.0 ) return length(q) - r1;
    if( k > a*h ) return length(q-vec2(0.0,h)) - r2;

    return dot(q, vec2(a,b) ) - r1;
}

float roundConeDist2(vec3 p, vec3 a, vec3 b, float r1, float r2)
{
    // sampling independent computations (only depend on shape)
    vec3  ba = b - a;
    float l2 = dot(ba,ba);
    float rr = r1 - r2;
    float a2 = l2 - rr*rr;
    float il2 = 1.0/l2;

    // sampling dependant computations
    vec3 pa = p - a;
    float y = dot(pa,ba);
    float z = y - l2;
    float x2 = dot2( pa*l2 - ba*y );
    float y2 = y*y*l2;
    float z2 = z*z*l2;

    // single square root!
    float k = sign(rr)*rr*rr*x2;
    if( sign(z)*a2*z2 > k ) return  sqrt(x2 + z2)        *il2 - r2;
    if( sign(y)*a2*y2 < k ) return  sqrt(x2 + y2)        *il2 - r1;
                            return (sqrt(x2*a2*il2)+y*rr)*il2 - r1;
}

float triPrismDist( vec3 p, vec2 h )
{
    const float k = sqrt(3.0);
    h.x *= 0.5*k;
    p.xy /= h.x;
    p.x = abs(p.x) - 1.0;
    p.y = p.y + 1.0/k;
    if( p.x+k*p.y>0.0 ) p.xy=vec2(p.x-k*p.y,-k*p.x-p.y)/2.0;
    p.x -= clamp( p.x, -2.0, 0.0 );
    float d1 = length(p.xy)*sign(-p.y)*h.x;
    float d2 = abs(p.z)-h.y;
    return length(max(vec2(d1,d2),0.0)) + min(max(d1,d2), 0.);
}

// vertical
float cylinderVerticalDist( vec3 p, vec2 h )
{
    vec2 d = abs(vec2(length(p.xz),p.y)) - h;
    return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

// arbitrary orientation
float cylinderDist(vec3 p, vec3 a, vec3 b, float r)
{
    vec3 pa = p - a;
    vec3 ba = b - a;
    float baba = dot(ba,ba);
    float paba = dot(pa,ba);

    float x = length(pa*baba-ba*paba) - r*baba;
    float y = abs(paba-baba*0.5)-baba*0.5;
    float x2 = x*x;
    float y2 = y*y*baba;
    float d = (max(x,y)<0.0)?-min(x2,y2):(((x>0.0)?x2:0.0)+((y>0.0)?y2:0.0));
    return sign(d)*sqrt(abs(d))/baba;
}

// vertical
float coneVerticalDist( in vec3 p, in vec2 c, float h )
{
    vec2 q = h*vec2(c.x,-c.y)/c.y;
    vec2 w = vec2( length(p.xz), p.y );

        vec2 a = w - q*clamp( dot(w,q)/dot(q,q), 0.0, 1.0 );
    vec2 b = w - q*vec2( clamp( w.x/q.x, 0.0, 1.0 ), 1.0 );
    float k = sign( q.y );
    float d = min(dot( a, a ),dot(b, b));
    float s = max( k*(w.x*q.y-w.y*q.x),k*(w.y-q.y)  );
        return sqrt(d)*sign(s);
}

float cappedConeDist( in vec3 p, in float h, in float r1, in float r2 )
{
    vec2 q = vec2( length(p.xz), p.y );

    vec2 k1 = vec2(r2,h);
    vec2 k2 = vec2(r2-r1,2.0*h);
    vec2 ca = vec2(q.x-min(q.x,(q.y < 0.0)?r1:r2), abs(q.y)-h);
    vec2 cb = q - k1 + k2*clamp( dot(k1-q,k2)/dot2(k2), 0.0, 1.0 );
    float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
    return s*sqrt( min(dot2(ca),dot2(cb)) );
}

float cappedConeDist_a(vec3 p, vec3 a, vec3 b, float ra, float rb)
{
    float rba  = rb-ra;
    float baba = dot(b-a,b-a);
    float papa = dot(p-a,p-a);
    float paba = dot(p-a,b-a)/baba;

    float x = sqrt( papa - paba*paba*baba );

    float cax = max(0.0,x-((paba<0.5)?ra:rb));
    float cay = abs(paba-0.5)-0.5;

    float k = rba*rba + baba;
    float f = clamp( (rba*(x-ra)+paba*baba)/k, 0.0, 1.0 );

    float cbx = x-ra - f*rba;
    float cby = paba - f;

    float s = (cbx < 0.0 && cay < 0.0) ? -1.0 : 1.0;

    return s*sqrt( min(cax*cax + cay*cay*baba,
                       cbx*cbx + cby*cby*baba) );
}

// c is the sin/cos of the desired cone angle
float solidAngleDist(vec3 pos, vec2 c, float ra)
{
    vec2 p = vec2( length(pos.xz), pos.y );
    float l = length(p) - ra;
        float m = length(p - c*clamp(dot(p,c),0.0,ra) );
    return max(l,m*sign(c.y*p.x-c.x*p.y));
}

float octahedronDist(vec3 p, float s)
{
    p = abs(p);
    float m = p.x + p.y + p.z - s;

    // exact distance
    #if 0
    vec3 o = min(3.0*p - m, 0.0);
    o = max(6.0*p - m*2.0 - o*3.0 + (o.x+o.y+o.z), 0.0);
    return length(p - s*o/(o.x+o.y+o.z));
    #endif

    // exact distance
    #if 1
        vec3 q;
         if( 3.0*p.x < m ) q = p.xyz;
    else if( 3.0*p.y < m ) q = p.yzx;
    else if( 3.0*p.z < m ) q = p.zxy;
    else return m*0.57735027;
    float k = clamp(0.5*(q.z-q.y+s),0.0,s);
    return length(vec3(q.x,q.y-s+k,q.z-k));
    #endif

    // bound, not exact
    #if 0
        return m*0.57735027;
    #endif
}


float pyramidDist( in vec3 p, in float h )
{
    float m2 = h*h + 0.25;

    // symmetry
    p.xz = abs(p.xz);
    p.xz = (p.z>p.x) ? p.zx : p.xz;
    p.xz -= 0.5;

    // project into face plane (2D)
    vec3 q = vec3( p.z, h*p.y - 0.5*p.x, h*p.x + 0.5*p.y);

    float s = max(-q.x,0.0);
    float t = clamp( (q.y-0.5*p.z)/(m2+0.25), 0.0, 1.0 );

    float a = m2*(q.x+s)*(q.x+s) + q.y*q.y;
        float b = m2*(q.x+0.5*t)*(q.x+0.5*t) + (q.y-m2*t)*(q.y-m2*t);

    float d2 = min(q.y,-q.x*m2-q.y*0.5) > 0.0 ? 0.0 : min(a,b);

    // recover 3D and scale, and add sign
    return sqrt( (d2+q.z*q.z)/m2 ) * sign(max(q.z,-p.y));;
}

// la,lb=semi axis, h=height, ra=corner
float rhombusDist(vec3 p, float la, float lb, float h, float ra)
{
    p = abs(p);
    vec2 b = vec2(la,lb);
    float f = clamp( (ndot(b,b-2.0*p.xz))/dot(b,b), -1.0, 1.0 );
        vec2 q = vec2(length(p.xz-0.5*b*vec2(1.0-f,1.0+f))*sign(p.x*b.y+p.z*b.x-b.x*b.y)-ra, p.y-h);
    return min(max(q.x,q.y),0.0) + length(max(q,0.0));
}

float horseshoeDist( in vec3 p, in vec2 c, in float r, in float le, vec2 w )
{
    p.x = abs(p.x);
    float l = length(p.xy);
    p.xy = mat2(-c.x, c.y,
              c.y, c.x)*p.xy;
    p.xy = vec2((p.y>0.0 || p.x>0.0)?p.x:l*sign(-c.x),
                (p.x>0.0)?p.y:l );
    p.xy = vec2(p.x,abs(p.y-r))-vec2(le,0.0);

    vec2 q = vec2(length(max(p.xy,0.0)) + min(0.0,max(p.x,p.y)),p.z);
    vec2 d = abs(q) - w;
    return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

Surface unionS(Surface s1,Surface s2)
{
    if(s1.d<=s2.d)
        return s1;
    else
        return s2;
}

Surface intersectionS(Surface s1,Surface s2)
{
    if(s1.d<=s2.d)
        return s2;
    else
        return s1;
}

Surface subtractionS(Surface s1,Surface s2)
{
    Surface Ret;
    if(s1.d<=(-s2.d))
    {
        Ret.color=s2.color;
        Ret.Ka=s2.Ka;
        Ret.Kd=s2.Kd;
        Ret.Ks=s2.Ks;
        Ret.d=-s2.d;
        return Ret;
    }
    else
        return s1;
}

Surface smoothUnionS(Surface s1, Surface s2, float k) {
    float h = clamp(0.5 + 0.5 * (s2.d - s1.d) / k, 0.0, 1.0);

    Surface result;
    result.d = mix(s2.d, s1.d, h) - k * h * (1.0 - h);

    result.color = mix(s2.color, s1.color, h);
    result.Ka = mix(s2.Ka, s1.Ka, h);
    result.Kd = mix(s2.Kd, s1.Kd, h);
    result.Ks = mix(s2.Ks, s1.Ks, h);

    return result;
}


Surface csgObject(vec3 p)
{
    float t =iTime;
    mat4 m = rotX (30. * t) * rotY (40. * t) * rotZ (50. * t)*trans(vec3( -1.2,-0.6, -2.0)) ;
    p = opTransf(p,m);
    Surface R;
    R.d = boxRoundDist((p), vec3(0.5),0.1);
    R.color = vec3(0.1,0.2,0.7); R.Ka=0.2; R.Kd=0.4;R.Ks=0.4;
    Surface S;
    S.d = sphereDist(p,vec3(0.0),0.6);
    S.color = vec3(0.1,0.2,0.7); S.Ka=0.2; S.Kd=0.4;S.Ks=0.4;
    R = subtractionS(R,S);
    return R;
}

vec3 planetTexture(vec2 n) {

    vec3 background = 0.9*vec3(0.4 +0.6*(1-(n.y+0.5)), 0.5*((n.y+0.5)), 1);

    float listras = 0.1*(n.y-(cos(n.y*PI*10    )*0.5+0.5));

    float shadow = cos(n.x*PI*2)*0.4+0.3;


    return background+vec3(listras*shadow);
}

vec2 toPlanetUV(vec3 p){
    float u = dot(vec2(p.x,p.z), vec2(1,0))*0.5+0.5;
    float v = p.y;
    return vec2(u,v);

}

Surface crystal(vec3 p, vec3 crystalPosition, vec3 color, float s, mat4 t)
{
    vec3 q = (p-crystalPosition)/s;
    q = opTransf(q, inverse(t));
    Surface mainCrystal = Surface(pyramidDist(q, 2), color, 1,1,1);
    mainCrystal = subtractionS(mainCrystal, Surface(boxDist(q-vec3(0,2,0),vec3(1,1,1)), color, 1,1,1));
    mainCrystal = unionS(mainCrystal,  Surface(pyramidDist((q-vec3(0,1,0))/0.5, 0.5)*0.5, color, 1,1,1) );
    mainCrystal = unionS(mainCrystal, Surface(boxDist(q-vec3(0,-1,0), vec3(0.5,1,0.5)), color, 1,1,1));
    mainCrystal.d *= s;
    return mainCrystal;
/*
    Surface crystalTop = Surface(pyramidDist(q-vec3(0,1,0), 0.75)*s,
        color, 0.25,0.8,0.9);

    Surface crystalBody = Surface(
        boxDist(q, vec3(0.5,1,0.5))*s,color, 0.25,0.8,0.9);

    Surface crystalBottom = Surface(pyramidDist(opTransf(q-vec3(0,-1,0), rotX(180)),
            1.75)*s,color, 0.2,0.8,0.2);

    crystalBody = unionS(crystalTop, crystalBody);
    return unionS(crystalBody, crystalBottom);*/
}

Surface crystalRock(vec3 p, vec3 position, vec3 color, float s, mat4 t)
{
    position += vec3(0, 0.55, 0)*s;

    p = (p-position)/s;
    p = opTransf(p, inverse(t));

    Surface centralCrystal = crystal(
        p, vec3(0), color, 1.0*s, rotX(0)
    );

    Surface leftCrystal = crystal(
        p, vec3(-0.95,-0.65,0)*s,
        color, s*0.65, rotZ(20)
    );

    Surface rightCrystal = crystal(
        p, vec3(0.85,-0.65,0)*s,
        color, s*0.65, rotZ(-20)
    );

    Surface frontCrystal = crystal(
        p, vec3(0,-0.65,0.85)*s,
        color, s*0.6, rotX(15)
    );

    Surface backCrystal = crystal(
        p, vec3(0,-0.65,-0.95)*s,
        color, s*0.6, rotZ(15) * rotX(-20)
    );

    centralCrystal = unionS(centralCrystal, leftCrystal);
    centralCrystal = unionS(centralCrystal, rightCrystal);
    centralCrystal = unionS(centralCrystal, frontCrystal);
    centralCrystal = unionS(centralCrystal, backCrystal);

    centralCrystal.d *= s;
    return centralCrystal;
}



Surface Missile(vec3 p, vec3 missilePosition, float radius, float s, mat4 t)
{
    // Local coordinates
    vec3 q = (p - missilePosition) / s;

    // Apply inverse transformation
    q = opTransf(q, inverse(t));
    q = opTransf(q, rotX(90));

    // Warhead
    Surface warhead = Surface(
        roundConeDist2(
            q - vec3(0,1.2,0),
            vec3(0,0.4,0),
            vec3(0,0,0),
            radius*0.82,
            radius
        ) * s,
        vec3(0.9,0,0), 0.1,1,1
    );

    // Main body
    Surface missileBody = Surface(
        cylinderVerticalDist(q, vec2(radius,1.2)) * s,
        vec3(0.65), 0.1,1,1
    );

    // Rear section
    Surface missileDown = Surface(
        cylinderVerticalDist(
            q + vec3(0,1.2,0),
            vec2(radius+0.015,0.2)
        ) * s,
        vec3(0.15), 0.1,1,1
    );

    // Turbine
    Surface turbine = Surface(
        roundConeDist2(
            q + vec3(0,1.8,0),
            vec3(0,0.4,0),
            vec3(0,0,0),
            radius*0.6,
            radius
        ) * s,
        vec3(0.2), 0.1,1,1
    );

    Surface turbineCut = Surface(
        cylinderVerticalDist(
            q + vec3(0,2,0),
            vec2(radius*1.2,0.2)
        ) * s,
        vec3(0.2), 0.1,1,1
    );

    turbine = subtractionS(turbine, turbineCut);

    Surface missile = unionS(missileBody, warhead);
    missile = unionS(missile, missileDown);
    missile = unionS(missile, turbine);

    return missile;
}
Surface Gun(vec3 p, vec3 position, float scale)
{
    p = (p - position) / scale;

    // Barrel
    Surface barrel = Surface(
        cylinderVerticalDist(
            opTransf(p-vec3(0,0,-0.8), rotX(90)),
            vec2(0.16, 0.9)
        ),
        vec3(0.18), 0.2, 0.8, 2.0
    );

    Surface body = Surface(
        roundConeDist2(
            p-vec3(0,0,0.2),
            vec3(0.0,0.0,0.0),
            vec3(00,0.0,1),
            0.2,0.4
        ),
        vec3(0.93,0.0,0.19), 0.2, 0.8, 1.0
    );

    Surface shooter = Surface(
        cylinderVerticalDist(
            opTransf(p-vec3(0,0,-1.7), rotX(90)),
            vec2(0.21,0.12)
        ),vec3(0.08), 0.2, 0.5, 5.0);

    Surface gun = unionS(unionS(body, barrel), shooter);

    gun.d *= scale;
    return gun;
}
Surface Bullet(vec3 p, vec3 position, float scale, mat4 t){
    p = opTransf(p - position, inverse(t)) / scale;
    return Surface(roundConeDist2(
            p, vec3(0,0,.0),
            vec3(0,0.0,1),
            0.01,0.05
        )*scale,
        vec3(1,0,0), 1, 0.0, 2.0
    );
}

Surface Enemy(vec3 p, vec3 position, mat4 t, float scale){
    // RED: vec3(0.93,0.0,0.19)
    p = opTransf(p - position, inverse(t)) / scale + position;
    Surface hull = Surface( cylinderVerticalDist( opTransf(p-position-vec3(0,0.4,-0.8),rotX(90))  , vec2(1.2,1.6)), vec3(0.2), 0.2, 0.8, 1);    

    Surface detail = Surface(  torusDist(p-position-vec3(0,0,-3), vec2(1.8,0.4)), vec3(0.2),0.5,0.5,100);

    Surface truncator = Surface( sphereDist(p,position+vec3(0,0.6,-5.0), 1.75), vec3(0.2), 0.5,0.5,0  );


    Surface visor = Surface(  sphereDist(p,position+vec3(0,0,-2.75), 1.5), vec3(0,0,1), 0.2,1,5  );
    Surface base = subtractionS(Surface(cylinderVerticalDist(p-position-vec3(0,-0.3,-3), vec2(1.6,0.2)), vec3(0.93, 0,0.19), 0.2,1,1 ), detail);
    base.color = vec3(0.93, 0,0.19);
    visor = subtractionS(visor,  Surface(boxDist(p-position-vec3(0,-1.2,-3), vec3(2,1,2)), vec3(0), 1,1,1 )  );
    detail.Ks = 1;
    detail = subtractionS(detail, truncator        );
    visor = unionS(visor, base);
    Surface cabin = subtractionS(subtractionS(Surface(sphereDist(p,position+vec3(0,0,-2.75), 1.7), vec3(0.15), 0.2, 0.8, 1  ),  Surface(boxDist(p-position-vec3(0,-1.2,-3), vec3(2,1,2)), vec3(0.15), 0.2, 0.8, 1)), Surface(boxDist(p-position-vec3(0,0,-4.5), vec3(2,2,2)), vec3(0.15), 0.2, 0.8, 1));
    //visor =  unionS(visor, cabin);

    hull = smoothUnionS(hull, cabin, 0.2);
    hull =  smoothUnionS(hull, detail, 0.5);

    Surface turbineBack = Surface(   cylinderVerticalDist(  opTransf(p-position  -vec3(0,0.4,1),rotX(90)) , vec2(0.9,1)), vec3(0.2), 0.2, 0.5, 0.9 );
    Surface turbineFireBack = Surface(   cylinderVerticalDist(  opTransf(p-position  -vec3(0,0.4,2),rotX(90)) , vec2(0.5,0.5)), vec3(1,0.31,0.09), 1, 0, 10 );
    Surface turbineBackDetail = Surface(   cylinderVerticalDist(  opTransf(p-position-vec3(0,0.4,1),rotX(90)) , vec2(1.1,0.65)),vec3(0.93,0.0,0.19), 0.2, 0.5, 0.9 );
    
    Surface turbineLeft = Surface(   cylinderVerticalDist(  opTransf(p-position  -vec3(2,-1.5,1.5),rotX(90)) , vec2(0.4,1)), vec3(0.2), 0.2, 0.5, 0.9 );
    Surface turbineFireLeft = Surface(   cylinderVerticalDist(  opTransf(p-position  -vec3(2,-1.5,2.5),rotX(90)) , vec2(0.2,0.5)), vec3(1,0.31,0.09), 1, 0, 10 );
    Surface turbineLeftDetail = Surface(   cylinderVerticalDist(  opTransf(p-position-vec3(2,-1.5,1.5),rotX(90)) , vec2(0.5,0.65)),vec3(0.93,0.0,0.19), 0.2, 0.5, 0.9 );

    Surface turbineRight = Surface(   cylinderVerticalDist(  opTransf(p-position  -vec3(-2,-1.5,1.5),rotX(90)) , vec2(0.4,1)), vec3(0.2), 0.2, 0.5, 0.9 );
    Surface turbineFireRight = Surface(   cylinderVerticalDist(  opTransf(p-position  -vec3(-2,-1.5,2.5),rotX(90)) , vec2(0.2,0.5)), vec3(1,0.31,0.09), 1, 0, 10 );
    Surface turbineRightDetail = Surface(   cylinderVerticalDist(  opTransf(p-position-vec3(-2,-1.5,1.5),rotX(90)) , vec2(0.5,0.65)),vec3(0.93,0.0,0.19), 0.2, 0.5, 0.9 );

    Surface rightConnection = Surface(  roundConeDist2(p-position-vec3(2,-1.5,0.5), vec3(0.0), vec3(-2,2.2,-1), 0.4,0.4 ), vec3(0.2), 0.2, 0.5, 1  );
    Surface leftConnection = Surface(  roundConeDist2(p-position-vec3(-2,-1.5,0.5), vec3(0.0), vec3(2,2.2,-1), 0.4,0.4 ), vec3(0.2), 0.2, 0.5, 1  );


    turbineLeft = unionS(turbineLeft, leftConnection);
    turbineRight = unionS(turbineRight, rightConnection);

    hull = smoothUnionS(leftConnection, hull, 0.3);
    hull = smoothUnionS(rightConnection, hull, 0.3);
    
    turbineLeft = subtractionS(unionS(turbineLeftDetail, turbineLeft ), turbineFireLeft);
    turbineRight = subtractionS(unionS(turbineRightDetail,turbineRight), turbineFireRight);
    turbineBack = subtractionS(unionS(turbineBackDetail, turbineBack), turbineFireBack);


    hull = unionS(hull, turbineLeft);
    hull = unionS(hull, turbineRight);

    hull = unionS(hull,turbineBack);

    Surface gunLeft = Gun(p, position + vec3(-1.6,-0.8,-2.7), 0.6);
    Surface gunRight = Gun(p, position + vec3(1.6,-0.8,-2.7), 0.6);

    Surface gunLeftConnection = Surface(
        boxDist(p-position-vec3(-1.6,-0.6,-2), vec3(0.1,0.3,0.1)),
        vec3(0.2), 0.2, 0.5, 1.0
    );

    Surface gunRightConnection = Surface(
        boxDist(p-position-vec3(1.6,-0.6,-2), vec3(0.1,0.3,0.1)),
        vec3(0.2), 0.2, 0.5, 1.0
    );

    hull = smoothUnionS(hull, gunLeftConnection, 0.02);
    hull = smoothUnionS(hull, gunRightConnection, 0.02);

    hull = unionS(hull, gunLeft);
    hull = unionS(hull, gunRight);



    hull = unionS(hull, visor);
    hull.d *= scale;
    return hull;
}



Surface getScope(vec3 p, vec3 position, mat4 t, mat4 scopeRot){

    p = opTransf(p, inverse(t));

    Surface haste = Surface( cylinderVerticalDist( p-position-vec3(0,1,0),vec2(0.08,1.1)), vec3(0.2), 0.2,0.5,1);
    Surface support = Surface( sphereDist( p,position+vec3(0,2,0),0.12), spaceship_color, 0.2,0.5,1);
  
    vec3 q = opTransf(p-position-vec3(0,2,0), scopeRot  )+position+vec3(0,2,0);

    Surface mainTube = Surface(cylinderVerticalDist(opTransf(q-position -vec3(0,2.2,-0.4),rotX(90)), vec2(0.2,1)), vec3(0.2), 0.2, 0.5, 0.9 );

    Surface tubeDetail = Surface( cylinderVerticalDist(  opTransf(q-position-vec3(0,2.2,-1.3),rotX(90)) , vec2(0.22,0.15)),spaceship_color, 0.2, 0.5, 0.9 );
    Surface tubeDetail2 = Surface(   cylinderVerticalDist(  opTransf(q-position-vec3(0,2.2,0.7),rotX(90)) , vec2(0.22,0.15)),spaceship_color, 0.2, 0.5, 0.9 );
    Surface view = Surface( sphereDist( q,position+vec3(0,2.2,-1.4),0.2), vec3(0,0,0.1), 0.0,0.25,2);




    mainTube = unionS(mainTube, unionS(tubeDetail, tubeDetail2));
    mainTube = unionS(mainTube, view);


    haste = unionS(haste, support);
    

    return unionS(mainTube, haste);

}


Surface Spaceship(vec3 p, vec3 position, mat4 t, mat4 scopeRotation, float s){
    // View spaceship


    p = opTransf(p-position, inverse(t))  / s+position;

    Surface hull = Surface(
        boxDist(p-position, vec3(1.5,1.5,3)),
        vec3(0.2),
        0.1, 1,0.6
    );
    hull = unionS(hull, Surface(
        boxDist(p-position-vec3(0,0.2,0), vec3(1.2,1.4,2.7)),
        spaceship_color,
        0.1, 1,0.6
    ));

    Surface visor = Surface(
        pyramidDist(   opTransf((p-position +vec3(0,0,3))/3, rotX(90)), 2.5)*3,
        spaceship_color,
        0.2,0.5,0.9
    );

     Surface glass = Surface(
        pyramidDist(   opTransf((p-position +vec3(0,-0.4,4))/2, rotX(90)), 2.5)*2,
        vec3(0,0.8,1),
        0.2,0.5,5
    );

    glass = subtractionS(glass, Surface(boxDist(p-position+vec3(0,0,11), vec3(1,1,3)), vec3(0,0.8,1), 0.2,0.5,5));
    

    Surface trunc = Surface(boxDist(p-position+vec3(0,0,12), vec3(1,1,3)), spaceship_color, 0.2,0.5,0.9);
  
    Surface turbineBack = Surface(   cylinderVerticalDist(  opTransf(p-position  -vec3(0,0,3),rotX(90)) , vec2(1.2,1.2)), vec3(0.2), 0.2, 0.5, 0.9 );
    Surface turbineFireBack = Surface(   cylinderVerticalDist(  opTransf(p-position  -vec3(0,0,4),rotX(90)) , vec2(0.8,0.7)), vec3(1,0.31,0.09), 1, 0, 10 );
    Surface turbineBackDetail = Surface(   cylinderVerticalDist(  opTransf(p-position-vec3(0,0,3),rotX(90)) , vec2(1.4,0.75)),spaceship_color, 0.2, 0.5, 0.9 );

    turbineBack = subtractionS(unionS(turbineBackDetail, turbineBack), turbineFireBack);

    hull = unionS(hull, turbineBack);



    Surface turbineLeftSpear = Surface(   roundConeDist2( p-position  -vec3(6,1,0), vec3(0,0,0), vec3(0,0,-3), 0.3,0.2), spaceship_color, 0.2, 0.5, 0.9 );
    Surface turbineLeft = Surface(   cylinderVerticalDist(  opTransf(p-position  -vec3(6,1,0),rotX(90)) , vec2(1,1.4)), vec3(0.2), 0.2, 0.5, 0.9 );

    Surface turbineFireLeft = Surface(   cylinderVerticalDist(  opTransf(p-position  -vec3(6,1,1),rotX(90)) , vec2(0.7,0.7)), vec3(1,0.31,0.09), 1, 0, 10 );
    Surface turbineLeftDetail = Surface(   cylinderVerticalDist(  opTransf(p-position-vec3(6,1,0),rotX(90)) , vec2(1.2,0.95)), vec3(0.2), 0.2, 0.5, 0.9 );

    Surface wingLeft_frust = Surface(
        pyramidDist(   opTransf((p-position +vec3(-1.65,0,0))/2, rotZ(75)), 4)*2,
        vec3(0.2),
        0.2,0.5,0.9
    );
    wingLeft_frust = unionS(wingLeft_frust, Surface(boxDist(p-position+vec3(-1.6,0,0), vec3(0.3,1.1,1.1)), spaceship_color, 0.2, 0.5,0.9)  );
    Surface wingLeft_trunc = Surface(boxDist(    opTransf(p-position+vec3(-8,-1,0),rotZ(-15)), vec3(2,1,1)), vec3(0.2), 0.2,0.5,0.9);
    Surface leftWing = subtractionS(wingLeft_frust, wingLeft_trunc);
    turbineLeft = unionS(leftWing, turbineLeft);
    turbineLeft = unionS(turbineLeft, turbineLeftDetail);
    turbineLeft = subtractionS(turbineLeft, turbineFireLeft);

    turbineLeft = unionS(turbineLeft, turbineLeftSpear);

    // RIGHT
    Surface turbineRightSpear = Surface(   roundConeDist2( p-position +vec3(6,-1,0), vec3(0,0,0), vec3(0,0,-3), 0.3,0.2), spaceship_color, 0.2, 0.5, 0.9 );
    Surface turbineRight = Surface(cylinderVerticalDist(opTransf(p-position + vec3(6,-1,0),rotX(90)) , vec2(1,1.4)), vec3(0.2), 0.2, 0.5, 0.9 );
    Surface turbineFireRight = Surface( cylinderVerticalDist( opTransf(p-position +vec3(6,-1,-1),rotX(90)) , vec2(0.7,0.7)), vec3(1,0.31,0.09), 1, 0, 10 );
    Surface turbineRightDetail = Surface( cylinderVerticalDist(opTransf(p-position+vec3(6,-1,0),rotX(90)) , vec2(1.2,0.95)), vec3(0.2), 0.2, 0.5, 0.9 );

    Surface wingRight_frust = Surface(
        pyramidDist(   opTransf((p-position +vec3(1.65,0,0))/2, rotZ(-75)), 4)*2,
        vec3(0.2),
        0.2,0.5,0.9
    );
    wingRight_frust = unionS(wingRight_frust, Surface(boxDist(p-position+vec3(1.6,0,0)  , vec3(0.3,1.1,1.1)), spaceship_color, 0.2, 0.5,0.9)  );
    Surface wingRight_trunc = Surface(boxDist(   opTransf(p-position+vec3(8,-1,0),rotZ(15)) , vec3(2,1,1)), vec3(0.2), 0.2,0.5,0.9);
    Surface RightWing = subtractionS(wingRight_frust, wingRight_trunc);
    turbineRight = unionS(RightWing, turbineRight);
    turbineRight = unionS(turbineRight, turbineRightDetail);
    turbineRight = subtractionS(turbineRight, turbineFireRight);

    turbineRight = unionS(turbineRight, turbineRightSpear);

    visor = subtractionS(visor,trunc);
    visor = unionS(visor, glass);
    hull = unionS(turbineLeft, hull);
    hull = unionS(turbineRight, hull);

    Surface scope = getScope(p, position, rotX(0), scopeRotation);
    hull = unionS(hull, scope);

    Surface result = unionS(visor, hull);

    result.d *= s;

    return result;
    // return unionS(visor, hull);

}

Surface miningClaw(vec3 p, vec3 position, float s, mat4 t, mat4 angle1, mat4 angle2, mat4 angle3, float openness){

    t = rotY(iTime*30);

    p = opTransf(p-position, inverse(t))  / s+position;


    angle1 = rotZ(iTime*40*2)* rotY(iTime*30*2)*rotX(iTime*15*2);
    angle2 = rotZ(iTime*40);
    angle3 = rotY(iTime*360);
    
   /*
    angle1 = rotX(0);
    angle2 = rotZ(-135);
    angle3 = rotY(iTime*40*0);*/

    Surface claw = Surface(MAX_DIST+1, vec3(0,0,0),0,0,0);
    Surface mainAngular = Surface(sphereDist(p, position, 1), spaceship_color, 0.2, 0.5, 0.3 );

    vec3 PIVOT_1 = opTransf(p-position, angle1);
    Surface arm1 = Surface( boxDist( PIVOT_1-vec3(0,-2.5,0), vec3(0.5,2.5,0.3)              ), vec3(0.4), 0.2, 0.5, 0.3);

    Surface armJoint = Surface( cylinderVerticalDist(  opTransf(PIVOT_1-vec3(0,-5,0), rotX(90))  , vec2(0.5,0.5)), spaceship_color, 0.3, 0.5, 0.7 );
    Surface armJointDetail = Surface( cylinderVerticalDist(  opTransf(PIVOT_1-vec3(0,-5,0), rotX(90))  , vec2(0.6,0.3)), vec3(0.4), 0.3, 0.5, 0.7 );
    armJoint = unionS(armJoint,armJointDetail);


    vec3 PIVOT_2 = opTransf(  PIVOT_1-vec3(0,-5,0), angle2);
    Surface arm2 = Surface( boxDist( PIVOT_2-vec3(0,-3,0), vec3(0.5,3,0.3)), vec3(0.4), 0.2, 0.5, 0.3);

    Surface clawJoint = Surface(sphereDist(  PIVOT_2,vec3(0,-6,0),0.8), spaceship_color, 0.3, 0.5, 0.7 );
//    Surface clawJoint = Surface(cylinderVerticalDist(  opTransf(PIVOT_2-vec3(0,-6,0), rotX(90)) , vec2(0.5,0.5)), spaceship_color, 0.3, 0.5, 0.7 );

    vec3 PIVOT_3 = opTransf(  PIVOT_2-vec3(0,-6,0), angle3);

    openness = cos(iTime*20)*0.5+0.5;
    float openAngle = openness*60;
    float limitAngle = 30;


    vec3 clawU_PIV = opTransf(PIVOT_3, rotZ(-openAngle-limitAngle));

    Surface upperClaw = Surface( boxDist( clawU_PIV-vec3(0,-1,0)  , vec3(0.5,1,0.3)), spaceship_color, 0.3, 0.5, 0.7);
    Surface upperClawDetail = Surface( cylinderVerticalDist(  opTransf(clawU_PIV+vec3(0,2,0), rotX(90)) , vec2(0.6,0.35)), spaceship_color-vec3(0.1,0.1,0.1), 0.3, 0.5, 0.7);

    upperClawDetail = unionS(upperClawDetail, Surface( cylinderVerticalDist(  opTransf(clawU_PIV+vec3(0,2,0), rotX(90)) , vec2(0.5,0.5)), spaceship_color-vec3(0.1,0.1,0.1), 0.3, 0.5, 0.7));
    Surface upperClawFinger = Surface( boxDist( opTransf(clawU_PIV+vec3(0,2,0), rotZ(50))   -vec3(0,-0.8,0), vec3(0.4,1.0,0.3)), spaceship_color, 0.3, 0.5, 0.7);


    upperClaw = unionS(upperClaw, upperClawDetail);
    upperClaw = unionS(upperClaw, upperClawFinger);

    vec3 clawD_PIV = opTransf(PIVOT_3, rotZ(openAngle+limitAngle));
    Surface downClaw = Surface( boxDist( clawD_PIV-vec3(0,-1,0)  , vec3(0.5,1,0.3)), spaceship_color, 0.3, 0.5, 0.7);
    Surface downClawDetail = Surface( cylinderVerticalDist(  opTransf(clawD_PIV+vec3(0,2,0), rotX(90)) , vec2(0.6,0.35)), spaceship_color-vec3(0.1,0.1,0.1), 0.3, 0.5, 0.7);

    downClawDetail = unionS(downClawDetail, Surface( cylinderVerticalDist(  opTransf(clawD_PIV+vec3(0,2,0), rotX(90)) , vec2(0.5,0.5)), spaceship_color-vec3(0.1,0.1,0.1), 0.3, 0.5, 0.7));
    Surface downClawFinger = Surface( boxDist( opTransf(clawD_PIV+vec3(0,2,0), rotZ(-50))   -vec3(0,-0.8,0), vec3(0.4,1.0,0.3)), spaceship_color, 0.3, 0.5, 0.7);
    downClaw = unionS(downClaw, downClawDetail);
    downClaw = unionS(downClaw, downClawFinger);

    claw = unionS(claw, mainAngular);
    claw = unionS(claw, arm1);
    claw = unionS(claw, armJoint);
    claw = unionS(claw, arm2);
    claw = unionS(claw, clawJoint);
    claw = unionS(claw, upperClaw);
    claw = unionS(claw, downClaw);

    claw.d *= s;
    return claw;
}



Surface getDist(vec3 p)
{
    Surface d = Surface(MAX_DIST+1, vec3(0,0,0), 0,0,0);

/*    Surface plane;
    plane.d = planeDist(p,vec3(0,1,0),0.0);
    plane.color = vec3(0.9,0.9,0.9);
    plane.Ka = 0.1;
    plane.Kd = 0.1;
    plane.Ks = 0.8;*/


   /* Surface asteroid = Surface(asteroidDist(p, vec3(5,0,10), 0.8, 1),vec3(0.42, 0.36, 0.929), 0.15,0.8,0.05 );
    Surface asteroid2 = Surface(asteroidDist(p, vec3(-5,5,10), 0.8, 2),vec3(0.52, 0.46, 0.39), 0.15,0.8,0.05 );
    Surface asteroid3 = Surface(asteroidDist(p, vec3(-5,0,15), 0.8, 3),vec3(0.42, 0.36, 0.29), 0.15,0.8,0.05 );
    Surface asteroid4 = Surface(asteroidDist(p, vec3(5,2,12), 0.8, 4),vec3(0.42, 0.936, 0.929), 0.15,0.8,0.05 );
    Surface asteroid5 = Surface(asteroidDist(p, vec3(3,-2,14), 0.8, 5),vec3(0.942, 0.36, 0.29), 0.15,0.8,0.05 );*/


    Surface sun = Surface( sphereDist(p,vec3(15,5,30),3), vec3(1,0.9,0),1,1,0);

    Surface planet;
    vec3 planetPosition = vec3(0,0,15);
    vec3 rotatedToPlanet = opTransf(p-planetPosition, rotY(30.*iTime)* rotZ(-15.));
    planet.d = sphereDist(p, planetPosition, 2);
    planet.color = planetTexture(toPlanetUV(normalize(rotatedToPlanet)   ));
    //planet.color = vec3(0.4,0.2,0.9);
    planet.Ka = 0.15; planet.Kd = 0.8; planet.Ks = 0.05;


    vec3 ringColor = vec3(0.75, 0.25, 0.9);
    Surface outerRing = Surface( cylinderVerticalDist(rotatedToPlanet, vec2(6,0.01)), ringColor, 0.15, 0.8, 0.05);
    Surface innerRing = Surface( cylinderVerticalDist(rotatedToPlanet, vec2(4,0.3)), ringColor, 0.15, 0.8, 0.05);

    Surface rings = subtractionS(outerRing, innerRing);


    vec3 claw_position = vec3(0,1,6);
    Surface claw = miningClaw(p, claw_position, 0.5, rotX(0), rotY(0),rotY(0), rotY(0),1);
    return claw;

    vec3 crystal_position = vec3(0,3,0);
    mat4 crystal_rotation = rotY(30*iTime);
    float crystal_scale = 0.5;

    Surface CRYSTAL_BOUNDING_SPHERE = Surface( sphereDist(p, crystal_position, 1.8*crystal_scale), vec3(0,0,1),1,1,1 );




    if(CRYSTAL_BOUNDING_SPHERE.d <= EPSILON){
        Surface c1 = crystalRock(p , crystal_position, vec3(0.16,0.48,0.84) ,crystal_scale, crystal_rotation);
      //  d = unionS(d, CRYSTAL_BOUNDING_SPHERE);
        d = unionS(d, c1);
    }else{
        d = unionS(d, CRYSTAL_BOUNDING_SPHERE);

    }
    






    /*vec3 missilePosition = vec3(0,3.5,4);
    float radius = 0.3;
    d = Missile(p, missilePosition, radius, 0.5, rotX(0));*/

  /*  d = unionS(asteroid, unionS(asteroid2, unionS(asteroid3, unionS(asteroid4, asteroid5))));*/
  



    vec3 spaceship_position = vec3(1,0,5);
    mat4 spaceship_rotation = rotX(30*iTime);
    float spaceship_scale = 0.2;
    mat4 scopeRotation = rotY(0);


    Surface SPACESHIP_BOUNDING_SPHERE = Surface( sphereDist(p, spaceship_position, 10*spaceship_scale), vec3(0,0,1),1,1,1 );



    if(SPACESHIP_BOUNDING_SPHERE.d <= EPSILON){
        Surface spaceship = Spaceship(p, spaceship_position, spaceship_rotation , scopeRotation, spaceship_scale);
    //    d = unionS(d, SPACESHIP_BOUNDING_SPHERE);
        d = unionS(d, spaceship);
    }else{
        d = unionS(d, SPACESHIP_BOUNDING_SPHERE);


    }


  //  return unionS(spaceship, SPACESHIP_BOUNDING_SPHERE);



    vec3 enemy_position = vec3(-4,0,5);
    mat4 enemyRotation = rotX(30*iTime);
    float enemyScale = 0.2;


    Surface ENEMY_BOUND_SPHERE = Surface(sphereDist(p,enemy_position, 5*enemyScale ), vec3(0,0,1), 1,1,1);

    
//    d = unionS(sun, ENEMY_BOUND_SPHERE);
    if( ENEMY_BOUND_SPHERE.d  <= (0+EPSILON) ){
        Surface enemy = Enemy(p, enemy_position, enemyRotation, enemyScale);

        vec3 leftMissileOffset  = vec3(-0.6, -0.8, -3.5)*enemyScale;
        vec3 rightMissileOffset = vec3( 0.6, -0.8, -3.5)*enemyScale;

        // World positions relative to enemy
        vec3 leftMissilePosition = enemy_position + opTransf(leftMissileOffset, enemyRotation);
        vec3 rightMissilePosition = enemy_position + opTransf(rightMissileOffset, enemyRotation);

        // Attached missiles
        Surface missile1 = Missile(p, leftMissilePosition, 0.2, 0.6*enemyScale, enemyRotation);
        Surface missile2 = Missile(p, rightMissilePosition, 0.2, 0.6*enemyScale, enemyRotation);

//        d = unionS(d, enemy);
        d = unionS(d, enemy);
        d = unionS(d, missile1);
        d = unionS(d, missile2);

    }else{
        d = unionS(ENEMY_BOUND_SPHERE,d);
        
    }

//    Surface bullet = Bullet(p, vec3(0,0,3),1,rotX(30*iTime));
   
    d = unionS(sun,d);

  

    return d;
/*
    d = unionS(d, spaceship);
    d = unionS(d, planet);
    d = unionS(d, rings);   
  

    return d;*/
}




Surface rayMarching(vec3 Cam, vec3 rd)
{
    float d0 = 0.0;
    vec3 pi = Cam +d0*rd;
    Surface s = getDist(pi);
    int i=0;
    while ((i<MAX_STEPS)&&(s.d>SURF_DIST)&&(d0<MAX_DIST))
    {
        d0+=s.d;
        pi = Cam+d0*rd;
        s=getDist(pi);
        i++;
    }
    if(i==MAX_STEPS) d0=MAX_DIST+1.0;
    s.d=d0;
    return s;
}

vec3 estimateNormal(vec3 p)
{
    Surface sd= getDist(p);

    float dx =  getDist(vec3(p.x+EPSILON,p.y,p.z)).d-sd.d;
    float dy = getDist(vec3(p.x,p.y+EPSILON,p.z)).d-sd.d;
    float dz = getDist(vec3(p.x,p.y,p.z+EPSILON)).d-sd.d;
    return normalize(vec3(dx,dy,dz));
}


//!DEBUGMODE

vec3  getLight(vec3 p,vec3 CamPos, Surface s) {
    vec3 lightPos = vec3(10.0,10.0,-10.0);
    vec3 lightColor = vec3(1.0);

    vec3 ld = lightPos-p;
    float lightDistance = length(ld);
    float fat  =1/lightDistance;
    vec3 l = ld*fat;

    vec3 n = estimateNormal(p);

    float dif = max(dot(n,l),0.0);
    // ambient
    vec3 col = s.color*s.Ka;
    // diffuse
    col += s.color*s.Kd*dif*(20.0*fat);

    float cameraDistance = length(p-CamPos);

    if(cameraDistance <= 15.0 && !DEBUGMODE){
        // Specular:
        vec3 eye = normalize(CamPos-p);
        vec3 R = reflect(-l,n);

        float phi = max(dot(eye,R),0.0);
        col += s.Ks*lightColor*pow(phi,5.0);

        // Shadow ray
        
        Surface sd = rayMarching(p+n*2.0*SURF_DIST,l);
        if(sd.d < lightDistance)
            col *= 0.25;
    }
    return col;
}

mat3 SetCamera(vec3 Look_at, vec3 CamPos)
{
    vec3 cd =normalize(Look_at-CamPos);
    vec3 cv = cross(vec3(0.0,1.0,0.0),cd);
    vec3 cu = cross(cd,cv);
    return mat3(cv,cu,cd);
}



vec3 spaceTexture(vec2 uv){
    vec3 background = vec3(0.01,0.01,0.09);
    vec3 background2 = vec3(0.09,0.01,0.09);
    vec2 center = uv-vec2(0.5,0.5) ;

    float d = length(center);

        

    return mix(background2, background, d)*0.5;




}

void main()
{
    vec2 p = (gl_FragCoord.xy-0.5*iResolution)/iResolution.y;
  
    vec3 CAMERA= vec3 (3.6*0,3.5-0.5,-5.0);
    vec3 Target = vec3 (0.0,1,10); // CAM TARGET
    Target = vec3(0,0,6);


    vec3 rd = normalize(vec3(p,1.2));
    //vec3 col = mix(vec3 (.01,0.1,0.1),COLOR_BACKGROUND,-p.y*0.2);

//    vec3 col = mix(vec3 (.01,0.1,0.1),COLOR_BACKGROUND,-p.y*0.2);

   

    vec2 mo = iMouse.xy/iResolution.xy;
    float am = mix(0.0,90.0,mo.x*iMouse.z);
    float bm = mix(0.0,90.0,mo.y*iMouse.z);

    mat4 Mry = rotY(am);
    mat4 Mrx = rotX(bm);
    mat4 M = Mrx*Mry;
    CAMERA=opTransf(CAMERA,M);


    //Target = opTransf(Target, rotY(10.*iTime));
    mat3 Mc = SetCamera( Target  ,CAMERA);
    rd = Mc*rd;

    vec3 col = spaceTexture( toPlanetUV(rd));
 //  vec3 col = spaceTexture(p+vec2(0.5,0.5));

    Surface s = rayMarching(CAMERA,rd);
    if(s.d<MAX_DIST )
    {
        vec3 po= CAMERA+s.d*rd;
         col= getLight(po,CAMERA,s);
    }

    
    //col = mix(COLOR_BACKGROUND,col,f);
    //C = vec4( planetTexture(vec2(p.x+0.5,p.y+0.5)) , 1.0 );
    C = vec4( col, 1.0 );
}

