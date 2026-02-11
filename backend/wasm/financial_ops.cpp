// C++ Financial Utility Implementation
// To be compiled to WebAssembly via Emscripten

#include <iostream>
#include <cmath>
#include <string>

extern "C" {
    // Precise currency conversion with fee calculation
    double calculate_total_with_fees(double base_price, double tax_rate, double processing_fee) {
        double tax = base_price * (tax_rate / 100.0);
        double fee = base_price * (processing_fee / 100.0);
        
        // Round to 2 decimal places precisely
        return std::round((base_price + tax + fee) * 100.0) / 100.0;
    }

    // Amortized discount logic
    double calculate_discounted_price(double original_price, double discount_percent) {
        if (discount_percent <= 0) return original_price;
        if (discount_percent >= 100) return 0.0;
        
        double discount = original_price * (discount_percent / 100.0);
        return std::round((original_price - discount) * 100.0) / 100.0;
    }
}
