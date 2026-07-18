<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = strip_tags(trim($_POST["full-name"]));
    $email = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);
    $subject = strip_tags(trim($_POST["subject"]));
    $message = trim($_POST["message"]);

    if (empty($name) || empty($subject) || empty($message) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo "Please complete the form and try again.";
        exit;
    }

    $recipient = "kasthousedoo@gmail.com"; // Your cPanel email
    $email_subject = "New Contact Form Submission: $subject";
    $email_body = "Name: $name\n";
    $email_body .= "Email: $email\n\n";
    $email_body .= "Message:\n$message\n";

    // Detect AJAX request
    $is_ajax = isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';

    // Headers for better deliverability
    $headers = "From: Kast House <noreply@kasthousedoo@gmail.com>\r\n";
    $headers .= "Reply-To: $name <$email>\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    if (mail($recipient, $email_subject, $email_body, $headers)) {
        http_response_code(200);
        echo "Thank you! Your message has been sent.";
        if (!$is_ajax) {
            echo '<br><button onclick="window.location.href=\'/\';">Go Home Page</button>';
        }
    } else {
        http_response_code(500);
        echo "Oops! Something went wrong, and we couldn't send your message.";
        if (!$is_ajax) {
            echo '<br><button onclick="window.location.href=\'/\';">Go Home Page</button>';
        }
    }
} else {
    http_response_code(403);
    echo "There was a problem with your submission. Please try again.";
    if (!$is_ajax) {
        echo '<br><button onclick="window.location.href=\'/\';">Go Home Page</button>';
    }
}
?>