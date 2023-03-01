struct Uniforms {
    model: mat4x4<f32>,
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
};

// TODO: make it better
struct Billboard {
    p1: vec3<f32>,
    p2: vec3<f32>,
    p3: vec3<f32>,
    p4: vec3<f32>,
    p5: vec3<f32>,
    p6: vec3<f32>,
}

struct Fragment {
    @builtin(position) Position : vec4<f32>,
    // @location(0) Color : vec4<f32>
};

@binding(0) @group(0) var<uniform> uniforms: Uniforms;
// TODO: only vec2
@binding(1) @group(0) var<uniform> curve: array<vec3<f32>, 3>;
// bind here also conversionFactor as uniform buffer, for normalization

const SEGMENTS: u32 = 20;

const billboard : Billboard = Billboard(
    vec3<f32>(-0.5, -0.5, 0.0),
    vec3<f32>(-0.5, 0.5, 0.0),
    vec3<f32>(0.5, -0.5, 0.0),
    vec3<f32>(0.5, -0.5, 0.0),
    vec3<f32>(-0.5, 0.5, 0.0),
    vec3<f32>(0.5, 0.5, 0.0)
);

// TODO: split vertex and fragment into separate files
// locations teda ani netreba ako draw
@vertex
fn vs_main(@builtin(vertex_index) VertexIndex : u32) -> @builtin(position) vec4<f32> {
    // var pos = array<vec3<f32>, 6>;

    var output: vec4<f32>;

    // output = uniforms.projection * uniforms.view * uniforms.model * vec4<f32>(normalize_point(curve[VertexIndex]), 1);

    // output.Color = vec4<f32>(vertexColor, 1.0);

    return output;
};

fn normalize_point(point: vec3<f32>) -> vec3<f32> {
    var width = billboard.p6.x - billboard.p1.x;
    var height = billboard.p1.y - billboard.p6.y;

    var normalized = (point - billboard.p1) / vec3<f32>(width, height, 0);
    var uv = vec3<f32>(normalized.x, 1.0 - normalized.y, 0);

    return uv;
}

// sdf, winding bude tu na vypocet bodu, ci je vnutri / nie je vnutri
// billboard je ako canvas pre tu krivku, krivku normalizovat na ten stvorec

@fragment
// discard pre pixel mimo; draw pre pixel vnutri
fn fs_main() -> @location(0) vec4<f32> {
    return vec4(1.0, 0.0, 0.0, 1.0);
}

// sending here parameters as typrs suggests
// and afterrwards here perfsorm
// normalization.

fn windingNumberCalculation(p1: vec3<i32>, p2: vec3<i32>, p3: vec2<i32>, pos: vec3<i32>) -> i32 {
    var a: vec2<i32> = p1.xy - pos.xy;
    var b: vec2<i32> = p2.xy - pos.xy;
    var c: vec2<i32> = p3.xy - pos.xy;

    var r: vec2<i32> = a - 2 * b + c;
    var s: vec2<i32> = a - b;

    var ra: f32 = 1.0 / f32(r.y);
    var rb: f32 = 0.5 / f32(s.y);
  
    var d: f32 = (sqrt(f32(max(s.y * s.y - r.y * a.y, 0))));
    var t1: f32 = (f32(s.y) - d) * ra;
    var t2: f32 = (f32(s.y) + d) * ra;
    
    // if 0 or close to 0
    if (r.y == 0) {
        t1 = f32(a.y) * rb;
        t2 = t1;
    }
  
    var res1: f32 = (f32(r.x) * t1 - f32(s.x) * 2) * t1 + f32(a.x);
    var res2: f32 = (f32(r.x) * t2 - f32(s.x) * 2) * t2 + f32(a.x);
  
    var code1: i32 = (-(a.y) & (b.y | c.y)) | (-(b.y) & c.y);
    var code2: i32 = (a.y & (-(b.y) | -(c.y))) | (b.y & -(c.y));
    
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