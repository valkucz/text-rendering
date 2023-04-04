// FIXME: premenovat
struct Uniforms {
    model: mat4x4<f32>,
    view: mat4x4<f32>,
    projection: mat4x4<f32>,

};

// TODO: rename
struct SceneObject {
    glyph: array<vec2<f32>>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
}
// TODO:
// struct color bg, text
struct Color {
    glyph: vec4<f32>,
    background: vec4<f32>,
}

// TODO: no need? remove?
struct Canvas {
    width: f32,
    height: f32
}

struct TextInfo  {
    bbox: vec4<f32>,
    canvas_bbox: vec4<f32>,
    glyph_length: f32,
}

@binding(0) @group(0) var<uniform> uniforms: Uniforms;
@binding(1) @group(0) var<storage, read_write> color: Color;
@binding(2) @group(0) var<uniform> canvas: Canvas;
@binding(3) @group(0) var<uniform> text_info: TextInfo;

@binding(0) @group(1) var<storage, read_write> object: SceneObject;
// TODO: split vertex and fragment into separate files
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


    var output: vec4<f32>;

     return VertexOutput(
        uniforms.projection * uniforms.view * uniforms.model * vec4<f32>(rectangle[VertexIndex].xyz, 1.0),
        squareUV[VertexIndex],
    );
};


fn get_rectangle() -> array<vec3<f32>, 6> {
    var min_x = text_info.bbox.x;
    var max_x = text_info.bbox.z;

    var canvas_wdith = text_info.canvas_bbox.z - text_info.canvas_bbox.x;
    var canvas_min_x = text_info.canvas_bbox.x;

    var norm_min_x = ((2 * (min_x - canvas_min_x)) / canvas_wdith) - 1.0;
    var norm_max_x = ((2 * (max_x - canvas_min_x)) / canvas_wdith) - 1.0;
    return array<vec3<f32>, 6>(
        vec3(norm_min_x, -0.5, 0.0),
        vec3(norm_min_x, 0.5, 0.0),
        vec3(norm_max_x, -0.5, 0.0),
        vec3(norm_max_x, -0.5, 0.0),
        vec3(norm_min_x, 0.5, 0.0),
        vec3(norm_max_x, 0.5, 0.0)
    );
}


@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
    var x = text_info.bbox.x + (text_info.bbox.z - text_info.bbox.x) * input.uv.x;
    var y = text_info.bbox.y + (text_info.bbox.w  - text_info.bbox.y) * input.uv.y;

    var mindist = 1000000.0;
    var side = 1.0;
    var flag = 0;
    for (var i: u32 = 0; i < u32(text_info.glyph_length); i += 3) {
        var sdist = sdf(object.glyph[i], object.glyph[i + 1], object.glyph[i + 2], vec2<f32>(x, y));
        // var sdist = sdBezier(object.glyph[i], object.glyph[i + 1], object.glyph[i + 2], vec2<f32>(x, y));
        var udist = abs(sdist.x);
        // var sgn = sign_bezier(object.glyph[i], object.glyph[i + 1], object.glyph[i + 2], vec2<f32>(x, y));

        if (udist < mindist) {
            mindist = udist;
            if (sdist.y > 0.0) {
                side = -1.0;
            }
            else {
                side = 1.0;
            }
        };
    }
    // if (side > 0.0) {
    //     return vec4(mindist / 1000, 0.0, 0.0, 1.0);
    // }
    // else {
    //     return color.background;
    // }


    let uvint = vec2(x, y);

    if (is_inside_glyph(vec2<i32>(uvint))){
        return color.glyph;
    }
    return color.background;
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
    for (var i: u32 = 0; i < u32(text_info.glyph_length) - 2; i += 3) {
        windingNumber += winding_number_calculation(vec2<i32>(object.glyph[i]), vec2<i32>(object.glyph[i + 1]), vec2<i32>(object.glyph[i + 2]), pos);
    }
    return windingNumber != 0;
}


fn cross_scalar(a: vec2<f32>, b: vec2<f32>) -> f32 {
    return a.x * b.y - a.y * b.x;
}

fn solve_cubic(a: f32, b: f32, c: f32) -> vec3<f32> {
    var p = b - a * a / 3.0;
    var p3 = p * p * p;
    var q = a * (2.0*a*a - 9.0*b) / 27.0 + c;
    var d = q*q + 4.0*p3 / 27.0;
    var offset = -a / 3.0;
    if(d >= 0.0) { 
        var z = sqrt(d);
        var x = (vec2(z, -z) - q) / 2.0;
        var uv = sign(x)*pow(abs(x), vec2(1.0/3.0));
        return vec3(offset + uv.x + uv.y);
    }
    var v = acos(-sqrt(-27.0 / p3) * q / 2.0) / 3.0;
    var m = cos(v);
    var n = sin(v)*1.732050808;
    return vec3(m + m, -n - m, n - m) * sqrt(-p / 3.0) + offset;
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

fn sdBezier(p1: vec2<f32>, p2: vec2<f32>, p3: vec2<f32>, p: vec2<f32>) -> f32
{    
    var p22 = mix(p2 + vec2(1e-4), p2, abs(sign(p2 * 2.0 - p1 - p3)));
    var a = p22 - p1;
    var b = p1 - p22 * 2.0 + p3;
    var c = a * 2.0;
    var d = p1 - p;
    var k = vec3(3.*dot(a,b), 2.*dot(a,a)+dot(d,b),dot(d,a)) / dot(b,b);      
    var t = saturate(solve_cubic(k.x, k.y, k.z));
    var pos = p1 + (c + b*t.x)*t.x;
    var dis = length(pos - p);
    pos = p1 + (c + b*t.y)*t.y;
    dis = min(dis, length(pos - p));
    pos = p1 + (c + b*t.z)*t.z;
    dis = min(dis, length(pos - p));
    return dis;
}


fn sdf(p1: vec2<f32>, p2: vec2<f32>, p3: vec2<f32>, pos: vec2<f32>) -> vec2<f32> {
    var a = p2 - p1;
    var b = p1 - 2.0 * p2 + p3;
    var c = a * 2.0;
    var d = p1 - pos;
    
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
    return vec2(sqrt(res), sign(sgn));
}