package com.shopverse.auth.helper;

import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertTrue;

class VerificationCodeGeneratorTest {

    @RepeatedTest(50)
    void generatesSixDigitNumericCode() {
        String code = VerificationCodeGenerator.generateCode();
        assertTrue(code.matches("\\d{6}"), "Expected a 6-digit code but got: " + code);
    }

    @Test
    void generatesVariedCodes() {
        Set<String> codes = new HashSet<>();
        for (int i = 0; i < 100; i++) {
            codes.add(VerificationCodeGenerator.generateCode());
        }
        assertTrue(codes.size() > 90, "Codes should be random, got only " + codes.size() + " unique values");
    }
}
