<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Detekcija AJAX zahtjeva
    $is_ajax = isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';

    // 1. HONEYPOT SPAM ZAŠTITA: Ako je skriveno polje popunjeno, radi se o botu
    if (!empty($_POST['website_confirm'])) {
        // Vraćamo lažni uspjeh da bot ne shvati da je blokiran
        http_response_code(200);
        echo "Hvala vam! Vaša poruka je uspješno poslata.";
        exit;
    }

    // Čišćenje ulaznih podataka iz forme (usklađeno sa HTML name atributima)
    $name     = strip_tags(trim($_POST["full-name"] ?? ''));
    $email    = filter_var(trim($_POST["email"] ?? ''), FILTER_SANITIZE_EMAIL);
    $service  = strip_tags(trim($_POST["service-type"] ?? ''));
    $quantity = strip_tags(trim($_POST["quantity"] ?? ''));
    $message  = trim($_POST["message"] ?? '');

    // Validacija obaveznih polja (Ime, Email, Usluga, Količina)
    if (empty($name) || empty($service) || empty($quantity) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo "Molimo vas da ispravno popunite sva obavezna polja u formi.";
        exit;
    }

    // Zvanična email adresa za primanje upita (RFQ)
    $recipient = "info@globalcnc.co"; 

    // Naslov emaila koji stiže vama
    $email_subject = "Global CNC RFQ Upit: $service ($quantity kom)";

    // Tijelo emaila
    $email_body  = "Prispio je novi upit sa web stranice globalcnc.co:\n\n";
    $email_body .= "Ime i prezime / Firma: $name\n";
    $email_body .= "Email adresa: $email\n";
    $email_body .= "Odabrana usluga: $service\n";
    $email_body .= "Tražena količina: $quantity kom\n\n";
    $email_body .= "Napomena / Poruka:\n";
    $email_body .= "--------------------------------------------------\n";
    $email_body .= (!empty($message) ? $message : "Korisnik nije ostavio dodatnu poruku.") . "\n";
    $email_body .= "--------------------------------------------------\n";

    // Headers za stabilnu isporuku
    // ISPRAVLJENO: Koristimo postojeći info@globalcnc.co umjesto noreply@ (koji ne postoji na cPanelu)
    $headers  = "From: Global CNC Website <info@globalcnc.co>\r\n";
    $headers .= "Reply-To: $name <$email>\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    // Slanje poruke
    if (mail($recipient, $email_subject, $email_body, $headers)) {
        http_response_code(200);
        echo "Hvala vam! Vaša poruka je uspješno poslata.";
        if (!$is_ajax) {
            echo '<br><br><button onclick="window.location.href=\'/\';">Povratak na početnu stranicu</button>';
        }
    } else {
        http_response_code(500);
        echo "Došlo je do greške prilikom slanja poruke. Molimo pokušajte ponovo.";
        if (!$is_ajax) {
            echo '<br><br><button onclick="window.location.href=\'/\';">Povratak na početnu stranicu</button>';
        }
    }
} else {
    http_response_code(403);
    echo "Pristup zabranjen. Molimo popunite formu sa sajta.";
    if (!$is_ajax) {
        echo '<br><br><button onclick="window.location.href=\'/\';">Povratak na početnu stranicu</button>';
    }
}
?>