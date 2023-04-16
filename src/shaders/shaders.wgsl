struct Uniforms {
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
    is_winding: f32

};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
}

struct Color {
    glyph: vec4<f32>,
    background: vec4<f32>,
}

struct Glyph {
    points: array<vec2<f32>>,
}

struct GlyphTransform {
    length: f32,
    model: mat4x4<f32>,
    bbox: vec4<f32>,
}


@binding(0) @group(0) var<uniform> uniforms: Uniforms;
@binding(1) @group(0) var<storage, read_write> color: Color;
@binding(0) @group(1) var<storage, read_write> glyph: Glyph;
@binding(1) @group(1) var<uniform> glyph_transform: GlyphTransform;
@vertex
fn vs_main(@builtin(vertex_index) VertexIndex : u32) -> VertexOutput {
    var rectangle = get_rectangle();

    var squareUV = array<vec2<f32>, 6>(
        vec2(0.0, 1.0),
        vec2(0.0, 0.0),
        vec2(1.0, 1.0),
        vec2(1.0, 1.0),
        vec2(0.0, 0.0),
        vec2(1.0, 0.0)
    );


     return VertexOutput(
        uniforms.projection * uniforms.view * glyph_transform.model * vec4<f32>(rectangle[VertexIndex].xyz, 1.0),
        squareUV[VertexIndex],
    );
};


fn get_rectangle() -> array<vec3<f32>, 6> {
    return array<vec3<f32>, 6>(
        vec3(-0.5, -0.5, 0.0),
        vec3(-0.5, 0.5, 0.0),
        vec3(0.5, -0.5, 0.0),
        vec3(0.5, -0.5, 0.0),
        vec3(-0.5, 0.5, 0.0),
        vec3(0.5, 0.5, 0.0)
    );
}


@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
    var x = glyph_transform.bbox.x + (glyph_transform.bbox.z - glyph_transform.bbox.x) * input.uv.x;
    var y = glyph_transform.bbox.y + (glyph_transform.bbox.w  - glyph_transform.bbox.y) * input.uv.y;
    if (uniforms.is_winding == 1) {
        return fill_winding(vec2<f32>(x, y));
    }
    return fill_sdf(vec2<f32>(x , y));
}

fn fill_sdf(pos: vec2<f32>) -> vec4<f32> {
    var mindist = 1000000.0;
    var side = 1.0;
    for (var i: u32 = 0; i < u32(glyph_transform.length); i += 4) {
        if (glyph.points[i].x < 0.0) {
            // Line
            let a = glyph.points[i + 1];
            let b = glyph.points[i + 3];
            var sdist = sdfLine(a, b, pos);

            // https://iquilezles.org/articles/interiordistance/
            // https://www.shadertoy.com/view/3t33WH
            let cond = vec3<bool>(pos.y >= a.y, (pos.y < b.y), sdist.y > 0.0);
            if( all(cond) || all(!(cond)) ) {
                side *= -1.0;
            }

            mindist = min(mindist, abs(sdist.x));
        } else {
            // Curve
            var sdist = sdfBezier(glyph.points[i + 1], glyph.points[i + 2], glyph.points[i + 3], pos);
            var udist = abs(sdist.x);

            if(sdist.z > 0.0) {
                side *= -1.0;
            }

            mindist = min(mindist, abs(sdist.x));
        }
    }
    mindist = sqrt(mindist);
    if ((side > 0.0)) {
        discard;
    }
    // color.glyph.x = color.glyph.x * mindist / 500;
    // return color.glyph;
    return vec4(mindist * color.glyph.x / 300, color.glyph.y, color.glyph.z, 1.0);
}


fn fill_winding(pos: vec2<f32>) -> vec4<f32>{
    if (!is_inside_glyph(vec2<i32>(pos))){
        discard;
    }
    return color.glyph;
}


fn winding_number_calculation(p1: vec2<i32>, p2: vec2<i32>, p3: vec2<i32>, pos: vec2<i32>) -> i32 {
    var a: vec2<i32> = p1 - pos;
    var b: vec2<i32> = p2 - pos;
    var c: vec2<i32> = p3 - pos;

    var r: vec2<i32> = a - 2 * b + c;
    var s: vec2<i32> = a - b;

    var ra: f32 = 1.0 / f32(r.y);
    var rb: f32 = 0.5 / f32(s.y);
  
    var d: f32 = (sqrt(f32(max(s.y * s.y - r.y * a.y, 0))));
    var t1: f32 = (f32(s.y) - d) * ra;
    var t2: f32 = (f32(s.y) + d) * ra;
    
    if (abs(r.y) == 0) {
        t1 = f32(a.y) * rb;
        t2 = t1;
    }
  
    var res1: f32 = (f32(r.x) * t1 - f32(s.x) * 2.0) * t1 + f32(a.x);
    var res2: f32 = (f32(r.x) * t2 - f32(s.x) * 2.0) * t2 + f32(a.x);
  
    var code1: i32 = (~(a.y) & (b.y | c.y)) | (~(b.y) & c.y);
    var code2: i32 = (a.y & (~(b.y) | ~(c.y))) | (b.y & ~(c.y));
    
    var windingNumber: i32 = 0;
    if ((code1 | code2) < 0) {
        if (code1 < 0 && res1 > 0.0) {
            windingNumber++;
        }
        if (code2 < 0 && res2 > 0.0) {
            windingNumber--;
        }
    }
    return windingNumber;
}

fn is_inside_glyph(pos: vec2<i32>) -> bool {
    var windingNumber: i32 = 0;
    for (var i: u32 = 0; i < u32(glyph_transform.length) - 2; i += 3) {
        windingNumber += winding_number_calculation(vec2<i32>(glyph.points[i]), vec2<i32>(glyph.points[i + 1]), vec2<i32>(glyph.points[i + 2]), pos);
    }
    return windingNumber != 0;
}


fn cross_scalar(a: vec2<f32>, b: vec2<f32>) -> f32 {
    return a.x * b.y - a.y * b.x;
}

fn test_cross(a: vec2<f32>, b: vec2<f32>, p: vec2<f32>) -> f32{
    return sign((b.y-a.y) * (p.x-a.x) - (b.x-a.x) * (p.y-a.y));
}

fn sign_bezier(p1: vec2<f32>, p2: vec2<f32>, p3: vec2<f32>, pos: vec2<f32>) -> f32 {

    var a = p3 - p1;
    var b = p2 - p1;
    var c = pos - p1;

    var bary = vec2(cross_scalar(c, b), cross_scalar(a, c)) / cross_scalar(a, b);
    var d = vec2(bary.y * 0.5, 0.0) + 1.0 - bary.x - bary.y;
    return mix(sign(d.x * d.x - d.y), mix(-1.0, 1.0, 
    step(test_cross(p1, p2, pos) * test_cross(p2, p3, pos), 0.0)),
    step((d.x - d.y), 0.0)) * test_cross(p1, p3, p2);
}


fn sdfBezier(p1: vec2<f32>, p2: vec2<f32>, p3: vec2<f32>, pos: vec2<f32>) -> vec3<f32> {
    var a = p2 - p1;
    var b = p1 - 2.0 * p2 + p3;
    var c = a * 2.0;
    var d = p1 - pos;

    // https://www.shadertoy.com/view/Ntyyzy    
    var odd = 1.0;
    // find if the number of intersection with an horizontal ray starting at p is odd
    // [Célestin Marot'2022]
    // intersection <=> root of  "b.y t^2 + c.y t + d.y" where 0<=t<=1
    if (abs(b.y) < 0.001) { // <- branch depends on control pts only, so perf. overhead should be negligible
        // linear case: count roots of "c.y t + d.y"
        var t = -d.y / c.y; // c.y should never be 0 if A and B are distinct
        if (t >= 0. && t <= 1. && d.x + (c.x + b.x*t) * t > 0.) {
            odd = -1.;
        }            
    }
    else {
        var h = c.y*c.y - 4.*b.y*d.y;
        if (h > 0.0) {
            h = sqrt(h);
            let t: vec2<f32> = (vec2(-h, h) - c.y) / (2.0* b.y);
            let x: vec2<f32> = d.x + (c.x + b.x*t) * t;
            let i: vec2<f32> = vec2(1.0) - vec2(2.0) * (step(vec2(0.0), t) * step(vec2(-1.0), -t) * step(vec2(0.0), x));
            odd = i.x * i.y;
        }
    }
    var kk = 1.0/dot(b,b);
    var kx = kk * dot(a,b);
    var ky = kk * (2.0*dot(a,a)+dot(d,b))/3.0;
    var kz = kk * dot(d,a); 

    var l = ky - kx * kx;
    var l3 = l * l * l;
    var q  = kx*(2.0*kx*kx - 3.0*ky) + kz;
    var h = q * q + 4.0 * l3;

    var res = 0.0;
    var sgn = 0.0;

    if (h >= 0.0) {
        h = sqrt(h);
        var x = (vec2(h, -h) - q) / 2.0;
        
        if(abs(abs(h/q) - 1.0) < 0.0001)
        {
            x = vec2(l3/q, -q - l3/q);
            if(q < 0.0){

                x = x.yx;
            }
        }
        var uv = sign(x) * pow(abs(x), vec2(1.0 / 3.0));
        var t = saturate(uv.x + uv.y - kx);
        var j = d + (c + b * t) * t;
        res = dot(j, j);
        sgn = cross_scalar((c + 2.0 * b * t), j);
    }
    else {
        var z = sqrt(-l);
        var v = acos(q / (l * z * 2.0)) / 3.0;
        var m = cos(v);
        var n = sin(v) * 1.732050808;
        var t = saturate(vec3(m + m, -n - m, n-m) * z - kx);
        var qx = d + (c + b * t.x) * t.x;
        var qy = d + (c + b * t.y) * t.y;

        var sx = cross_scalar(c + 2.0 * b * t.x, qx);
        var sy = cross_scalar(c + 2.0 * b * t.y, qy);

        var dx = dot(qx, qx);
        var dy = dot(qy, qy);
        
        if (dx < dy) {
            res = dx;
            sgn = sx;
        }
        else {
            res = dy;
            sgn = sy;
        }
    }
    return vec3(res, sign(sgn), odd);
}

fn sdfLine(a: vec2<f32>, b: vec2<f32>, pos: vec2<f32>) -> vec2<f32> {
    var pa = pos - a;
    var ba = b - a;
    var h = saturate(dot(pa, ba) / dot(ba, ba));
    return vec2( dot(pa-ba*h, pa-ba*h), sign(cross_scalar(ba, pa)));
}
