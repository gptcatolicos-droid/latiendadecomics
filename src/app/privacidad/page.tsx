export const metadata = {
  title: 'Política de Privacidad — La Tienda de Comics',
  description: 'Política de privacidad y tratamiento de datos personales de La Tienda de Comics Colombia.',
};

export default function PrivacidadPage() {
  const today = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', color: '#222', lineHeight: 1.7 }}>
      <a href="/" style={{ fontSize: 13, color: '#CC0000', textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>← Volver a la tienda</a>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 6, letterSpacing: '-.02em' }}>Política de Privacidad y Tratamiento de Datos</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>Última actualización: {today}</p>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 40 }}>En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013 de Colombia sobre protección de datos personales.</p>

      {[
        { title: '1. Responsable del tratamiento', content: 'La Tienda de Comics, con domicilio en Colombia, es el responsable del tratamiento de los datos personales recopilados a través de latiendadecomics.com. Para consultas sobre privacidad puede contactarnos en: superpoder@latiendadecomics.com o por WhatsApp al +57 318 707 9104.' },
        { title: '2. Datos que recopilamos', content: 'Recopilamos: (a) Datos de contacto: nombre completo, correo electrónico, número de teléfono; (b) Datos de envío: dirección postal, ciudad, departamento, código postal; (c) Datos de navegación: dirección IP, tipo de navegador, páginas visitadas, tiempo en el sitio (a través de Google Analytics); (d) Datos de transacción: historial de pedidos, métodos de pago utilizados (sin almacenar datos de tarjetas). No recopilamos datos sensibles como información racial, política, religiosa o de salud.' },
        { title: '3. Finalidad del tratamiento', content: 'Sus datos personales son utilizados para: (1) Procesar y gestionar sus pedidos; (2) Enviar confirmaciones de compra y actualizaciones de envío; (3) Brindar soporte al cliente; (4) Enviar comunicaciones comerciales sobre promociones y novedades (solo con su consentimiento); (5) Mejorar nuestros servicios mediante análisis de uso; (6) Cumplir con obligaciones legales y tributarias.' },
        { title: '4. Base legal del tratamiento', content: 'El tratamiento de sus datos se basa en: (a) La ejecución del contrato de compraventa cuando realiza un pedido; (b) Su consentimiento explícito para comunicaciones de marketing; (c) El interés legítimo para mejorar nuestros servicios; (d) El cumplimiento de obligaciones legales aplicables en Colombia.' },
        { title: '5. Compartición de datos', content: 'Compartimos sus datos únicamente con: (a) Proveedores de logística y envíos para gestionar la entrega de pedidos; (b) Procesadores de pago (MercadoPago) para gestionar transacciones de forma segura; (c) Amazon cuando realiza compras a través de nuestros enlaces de afiliado; (d) Google Analytics para análisis de tráfico web (datos anonimizados). No vendemos, alquilamos ni cedemos sus datos a terceros con fines comerciales.' },
        { title: '6. Sus derechos (Habeas Data)', content: 'De conformidad con la Ley 1581 de 2012, usted tiene derecho a: Conocer, actualizar, rectificar y suprimir sus datos personales; Solicitar prueba de la autorización otorgada; Ser informado sobre el uso de sus datos; Presentar quejas ante la Superintendencia de Industria y Comercio; Revocar la autorización y/o solicitar la supresión del dato. Para ejercer estos derechos, envíe una solicitud a superpoder@latiendadecomics.com.' },
        { title: '7. Cookies y tecnologías de rastreo', content: 'Utilizamos cookies propias y de terceros (Google Analytics) para mejorar su experiencia de navegación y analizar el uso del sitio. Puede configurar su navegador para rechazar cookies, aunque esto puede afectar algunas funcionalidades del sitio. Las cookies de sesión se eliminan al cerrar el navegador; las cookies persistentes tienen una duración máxima de 2 años.' },
        { title: '8. Seguridad de los datos', content: 'Implementamos medidas técnicas y organizativas apropiadas para proteger sus datos personales contra acceso no autorizado, pérdida o destrucción. Utilizamos cifrado SSL/TLS para todas las comunicaciones. Los datos de pago son procesados directamente por MercadoPago bajo sus estándares de seguridad PCI DSS.' },
        { title: '9. Retención de datos', content: 'Conservamos sus datos personales durante el tiempo necesario para cumplir con las finalidades descritas y las obligaciones legales aplicables. Los datos de transacciones se conservan por 5 años de acuerdo con la normativa tributaria colombiana. Puede solicitar la eliminación de sus datos en cualquier momento, sujeto a las obligaciones legales de retención.' },
        { title: '10. Cambios a esta política', content: 'Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos cambios significativos por correo electrónico o mediante un aviso visible en nuestro sitio web. Le recomendamos revisar esta política regularmente.' },
      ].map((section, i) => (
        <div key={i} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#111' }}>{section.title}</h2>
          <p style={{ fontSize: 15, color: '#444', margin: 0 }}>{section.content}</p>
        </div>
      ))}

      <div style={{ marginTop: 48, padding: 20, background: '#f7f7f7', borderRadius: 12, fontSize: 13, color: '#666' }}>
        <strong style={{ color: '#333' }}>Autoridad de control:</strong> Superintendencia de Industria y Comercio (SIC) — <a href="https://www.sic.gov.co" target="_blank" rel="noopener" style={{ color: '#CC0000' }}>www.sic.gov.co</a>
      </div>
    </div>
  );
}
