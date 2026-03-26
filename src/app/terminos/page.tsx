export const metadata = {
  title: 'Términos y Condiciones — La Tienda de Comics',
  description: 'Términos y condiciones de uso de La Tienda de Comics. Política de compra, envíos y devoluciones.',
};

export default function TerminosPage() {
  const today = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', color: '#222', lineHeight: 1.7 }}>
      <a href="/" style={{ fontSize: 13, color: '#CC0000', textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>← Volver a la tienda</a>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 6, letterSpacing: '-.02em' }}>Términos y Condiciones</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 40 }}>Última actualización: {today}</p>

      {[
        { title: '1. Aceptación de los términos', content: 'Al acceder y utilizar La Tienda de Comics (latiendadecomics.com), usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al servicio. Estos términos aplican a todos los visitantes, usuarios y personas que accedan o utilicen el servicio.' },
        { title: '2. Descripción del servicio', content: 'La Tienda de Comics es una plataforma de comercio electrónico especializada en cómics, figuras coleccionables y manga para Colombia y Latinoamérica. Operamos como intermediarios entre proveedores internacionales como Midtown Comics, Iron Studios, Panini y Amazon, ofreciendo un servicio de dropshipping con entrega a toda Colombia y LATAM.' },
        { title: '3. Precios y pagos', content: 'Todos los precios se muestran en pesos colombianos (COP) y dólares estadounidenses (USD). Los precios incluyen el margen de servicio y los costos de importación estimados. El pago se procesa de forma segura a través de MercadoPago. La Tienda de Comics no almacena información de tarjetas de crédito. Los precios pueden cambiar sin previo aviso debido a fluctuaciones en la tasa de cambio.' },
        { title: '4. Envíos y tiempos de entrega', content: 'Los tiempos de entrega estimados son de 6 a 10 días hábiles para Colombia y 8 a 15 días hábiles para el resto de Latinoamérica. Estos tiempos son estimados y pueden variar por factores externos como aduanas, feriados o problemas logísticos. El costo de envío a Colombia es de $5 USD y al exterior $30 USD. Una vez despachado el pedido, se enviará un correo con el número de tracking.' },
        { title: '5. Política de devoluciones', content: 'Aceptamos devoluciones dentro de los 15 días posteriores a la recepción del producto, siempre que el artículo esté en su estado original, sin usar y en el empaque original. Los gastos de envío de devolución corren por cuenta del cliente, excepto cuando el producto llegue defectuoso o sea incorrecto. Para iniciar una devolución, contacte a nuestro equipo por WhatsApp o email.' },
        { title: '6. Productos de terceros', content: 'Algunos productos listados en nuestra tienda son enlaces de afiliado de Amazon. Al hacer clic en "Comprar en Amazon", será redirigido al sitio web de Amazon donde completará su compra directamente con ellos. En estos casos, los términos de Amazon aplican para esa transacción. La Tienda de Comics puede recibir una comisión por estas compras sin costo adicional para usted.' },
        { title: '7. Propiedad intelectual', content: 'Todo el contenido de este sitio web, incluyendo textos, imágenes, logos y diseños son propiedad de La Tienda de Comics o de sus proveedores. Las imágenes de portadas de cómics y figuras son propiedad de sus respectivos editores y fabricantes (DC Comics, Marvel Entertainment, Iron Studios, etc.) y se utilizan con fines comerciales legítimos.' },
        { title: '8. Limitación de responsabilidad', content: 'La Tienda de Comics no será responsable por daños indirectos, incidentales o consecuentes derivados del uso de nuestros productos o servicios. Nuestra responsabilidad máxima se limita al valor del pedido en cuestión. No somos responsables por retrasos causados por aduanas, desastres naturales u otras causas de fuerza mayor.' },
        { title: '9. Modificaciones', content: 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigencia inmediatamente después de su publicación en el sitio web. El uso continuado del servicio después de dichos cambios constituye su aceptación de los nuevos términos.' },
        { title: '10. Contacto', content: 'Para cualquier pregunta sobre estos Términos y Condiciones, puede contactarnos a través de WhatsApp al +57 318 707 9104 o por correo electrónico a hola@latiendadecomics.com.' },
      ].map((section, i) => (
        <div key={i} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#111' }}>{section.title}</h2>
          <p style={{ fontSize: 15, color: '#444', margin: 0 }}>{section.content}</p>
        </div>
      ))}
    </div>
  );
}
