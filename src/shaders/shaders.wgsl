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
    p6: vec3<f32>
}


struct Fragment {
    @builtin(position) Position : vec4<f32>,
    @location(0) Color : vec4<f32>
};

const SEGMENTS: u32 = 20;

@binding(0) @group(0) var<uniform> uniforms: Uniforms;
@binding(1) @group(0) var<uniform> square: Billboard;

// TODO: split vertex and fragment into separate files
@vertex
fn vs_main(@location(0) vertexPosition: vec3<f32>, @location(1) vertexColor: vec3<f32>) -> Fragment {
    var output: Fragment;

    output.Position = uniforms.projection * uniforms.view * uniforms.model * vec4<f32>(normalize_point(vertexPosition), 1);

    output.Color = vec4<f32>(vertexColor, 1.0);

    return output;
};

fn normalize_point(point: vec3<f32>) -> vec3<f32> {
    var width = square.p6.x - square.p1.x;
    var height = square.p1.y - square.p6.y;

    var normalized = (point - square.p1) / vec3<f32>(width, height, 0);
    var uv = vec3<f32>(normalized.x, 1.0 - normalized.y, 0);

    return uv;
}

// fn de_casteljau(points: array<vec3<f32>>, t: u32) -> vec3<f32> {

// }

// fn solve_de_casteljau(points: array<vec3<f32>>) -> array<vec3<f32>> {
//     var res = array<vec3<f32>>;
//     for (var i = 0; i < SEGMENTS; i++) {
//         res[i] = de_casteljau(points, i / select(1, SEGMENTS - 1, SEGMENTS == 1));
//     }

// }

@fragment
fn fs_main(@location(0) Color: vec4<f32>) -> @location(0) vec4<f32> {
    // TODO: run deCasteljau 
    return Color;
}


