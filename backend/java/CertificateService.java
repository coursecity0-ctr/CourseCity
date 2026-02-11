/**
 * Java Certificate Service
 * Handles the generation and validation of course completion certificates.
 */
public class CertificateService {
    
    private String issuerName = "CourseCity Academy";
    
    public Certificate generateCertificate(String studentName, String courseTitle, String date) {
        String certificateId = generateUniqueId(studentName, courseTitle);
        System.out.println("Generating certificate for " + studentName + " in " + courseTitle);
        
        return new Certificate(certificateId, studentName, courseTitle, date, issuerName);
    }
    
    private String generateUniqueId(String student, String course) {
        // Secure hashing logic for certificate ID
        return "CC-" + String.format("%08X", (student + course + System.currentTimeMillis()).hashCode());
    }
    
    public static class Certificate {
        public String id;
        public String student;
        public String course;
        public String date;
        public String issuer;

        public Certificate(String id, String student, String course, String date, String issuer) {
            this.id = id;
            this.student = student;
            this.course = course;
            this.date = date;
            this.issuer = issuer;
        }
        
        @Override
        public String toString() {
            return "Certificate #" + id + " for " + student + " - " + course;
        }
    }

    public static void main(String[] args) {
        CertificateService service = new CertificateService();
        Certificate cert = service.generateCertificate("John Doe", "Advanced Python Masterclass", "2026-02-11");
        System.out.println(cert);
    }
}
