// FIXME: premenovat
struct Uniforms {
    model: mat4x4<f32>,
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
    conversion_factor: vec4<f32>,
    glyph_length: f32,
};

// TODO: rename
struct SceneObject {
    // error: aligned to 16 bytes
    // FIXME: ak je to storage, da sa zmenit na vec2? 
    glyph: array<vec4<f32>>,
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

@binding(0) @group(0) var<uniform> uniforms: Uniforms;
@binding(1) @group(0) var<storage, read_write> object: SceneObject;
@binding(2) @group(0) var<storage, read_write> color: Color;

// TODO: split vertex and fragment into separate files
@vertex
fn vs_main(@builtin(vertex_index) VertexIndex : u32) -> VertexOutput {
    var square = array<vec3<f32>, 6>(
        vec3(-0.5, -0.5, 0.0),
        vec3(-0.5, 0.5, 0.0),
        vec3(0.5, -0.5, 0.0),
        vec3(0.5, -0.5, 0.0),
        vec3(-0.5, 0.5, 0.0),
        vec3(0.5, 0.5, 0.0)
        
    );
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
        uniforms.projection * uniforms.view * uniforms.model * vec4<f32>(square[VertexIndex].xyz, 1.0),
        squareUV[VertexIndex],
    );
};

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
    // return vec4<f32>(object.glyph[14].w / (28600 * 2), 0.0, 0.0, 1.0);
    // conversion_factor.x min x
    // covnersion_factor.y min y
    // conversion_factor.z max x
    // covnersion factor.w max y
    var x = uniforms.conversion_factor.x + (uniforms.conversion_factor.z - uniforms.conversion_factor.x) * input.uv.x;
    var y = uniforms.conversion_factor.y + (uniforms.conversion_factor.w  - uniforms.conversion_factor.y) * input.uv.y;

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
    
    // if 0 or close to 0
    if (r.y == 0) {
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
    // 15; i < 14 ... max i = 13 ... po 3, i = 12
    for (var i: u32 = 0; i < u32(uniforms.glyph_length) - 1; i += 3) {
        // sude => xy zw xy
        // liche => zw xy zw
        // because vec4 is required
        windingNumber += winding_number_calculation(vec2<i32>(object.glyph[i].xy), vec2<i32>(object.glyph[i].zw), vec2<i32>(object.glyph[i + 1].xy), pos);
        windingNumber += winding_number_calculation(vec2<i32>(object.glyph[i + 1].zw), vec2<i32>(object.glyph[i + 2].xy), vec2<i32>(object.glyph[i + 2].zw), pos);
    }
    

    return windingNumber != 0;
}