// Rust Fuzzy Search Implementation
// To be compiled to WebAssembly (wasm32-unknown-unknown)

#[no_mangle]
pub fn fuzzy_match(query: &str, text: &str) -> i32 {
    let query = query.to_lowercase();
    let text = text.to_lowercase();
    
    if query.is_empty() { return 100; }
    if text.is_empty() { return 0; }
    
    let mut score = 0;
    let mut last_idx = 0;
    
    for q_char in query.chars() {
        if let Some(idx) = text[last_idx..].find(q_char) {
            let actual_idx = last_idx + idx;
            // Higher score for matches closer to each other or at the start
            score += 10 - (actual_idx - last_idx) as i32;
            last_idx = actual_idx + 1;
        } else {
            return 0; // No match
        }
    }
    
    score
}

// Example usage in JS:
// const result = wasm.fuzzy_match("react", "Introduction to React.js");
