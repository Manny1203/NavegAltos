import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function LegalDisclaimerModal({ isOpen, onAccept, buttonText = "Entendido y Acepto" }) {
  if (!isOpen) return null;

  return (
    <div className="action-modal-overlay" style={{ zIndex: 9999 }}>
      <div className="action-modal" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="action-modal-header" style={{ justifyContent: 'center', marginBottom: '16px' }}>
          <ShieldAlert size={28} color="#E25E24" />
          <h2 style={{ fontSize: '20px', color: 'var(--text-heading)', margin: 0, textAlign: 'center', width: '100%' }}>Términos y Condiciones de Uso</h2>
        </div>
        
        <div style={{ fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.6', marginBottom: '24px', textAlign: 'justify' }}>
          <p><strong>Bienvenido a NavegAltos.</strong> Al acceder o utilizar nuestra aplicación de orientación y navegación interna para el Centro Universitario de los Altos (CUAltos), aceptas cumplir y estar sujeto a los siguientes términos y condiciones. Si no estás de acuerdo con alguno de ellos, debes suspender el uso de la aplicación de inmediato.</p>
          
          <h4 style={{ color: 'var(--text-heading)', marginTop: '16px', marginBottom: '8px' }}>1. Descripción del Servicio</h4>
          <p>NavegAltos es una herramienta digital de carácter informativo y didáctico diseñada para facilitar la localización de aulas, dependencias y servicios dentro del campus de CUAltos. El servicio se proporciona de manera gratuita, "tal cual" y "según disponibilidad".</p>
          
          <h4 style={{ color: 'var(--text-heading)', marginTop: '16px', marginBottom: '8px' }}>2. Deslinde de Responsabilidad</h4>
          <p>Este apartado excluye expresamente al equipo de desarrollo de cualquier reclamo legal, administrativo o civil:</p>
          <ul style={{ paddingLeft: '20px', marginBottom: '8px' }}>
            <li><strong>Precisión de la Información:</strong> El diseño y la distribución del campus están sujetos a cambios constantes por parte de las autoridades universitarias. Los desarrolladores no garantizan que los mapas, rutas, nombres de aulas o disponibilidad de servicios sean 100% exactos, completos o actualizados.</li>
            <li><strong>Incidentes y Seguridad Física:</strong> El uso de la aplicación es bajo el propio riesgo del usuario. El equipo desarrollador no se hace responsable por accidentes, caídas, lesiones físicas, pérdida de pertenencias ni por cualquier otra eventualidad que ocurra mientras el usuario se desplaza utilizando las rutas sugeridas por la aplicación.</li>
            <li><strong>Perjuicios Académicos o Laborales:</strong> No nos hacemos responsables por retrasos, inasistencias a clases, exámenes o citas administrativas derivados de fallas de orientación en la app.</li>
            <li><strong>Fallas Técnicas y Continuidad:</strong> Excluimos cualquier responsabilidad por la interrupción temporal o definitiva del servicio, fallas en el servidor, pérdida de datos, errores en la base de datos o daños de software/hardware en los dispositivos de los usuarios.</li>
          </ul>

          <h4 style={{ color: 'var(--text-heading)', marginTop: '16px', marginBottom: '8px' }}>3. Propiedad Intelectual</h4>
          <p>Todo el código fuente, la arquitectura de software, el diseño de la interfaz, los logotipos y las bases de datos de NavegAltos son propiedad exclusiva del equipo desarrollador. Queda prohibida la reproducción, modificación, distribución o ingeniería inversa del sistema sin una autorización expresa y por escrito de los creadores.</p>

          <h4 style={{ color: 'var(--text-heading)', marginTop: '16px', marginBottom: '8px' }}>4. Uso Aceptable de la Plataforma</h4>
          <p>Como usuario, te comprometes a utilizar la aplicación exclusivamente para fines de orientación legítimos. Queda estrictamente prohibido intentar alterar, saturar o vulnerar la seguridad de los servidores, APIs o bases de datos de la aplicación, así como utilizar cualquier método automatizado (bots, scrapers) para extraer datos de la plataforma.</p>

          <h4 style={{ color: 'var(--text-heading)', marginTop: '16px', marginBottom: '8px' }}>5. Privacidad y Manejo de Datos</h4>
          <p>NavegAltos recopila y procesa únicamente la información técnica y de autenticación estrictamente necesaria para garantizar el correcto funcionamiento de la navegación. El rastreo de la ubicación GPS se procesa localmente en el dispositivo del usuario para brindar orientación en tiempo real y <strong>no se almacena en nuestros servidores</strong>. No vendemos, transferimos ni exponemos datos personales a terceros sin consentimiento previo, alineándonos con las normativas vigentes de protección de datos.</p>

          <h4 style={{ color: 'var(--text-heading)', marginTop: '16px', marginBottom: '8px' }}>6. Modificaciones a los Términos</h4>
          <p>El equipo desarrollador se reserva el derecho de modificar, actualizar o dar por terminados estos Términos y Condiciones en cualquier momento y sin previo aviso. El uso continuado de NavegAltos tras la publicación de los cambios constituirá la aceptación de los nuevos términos.</p>
        </div>

        <button 
          onClick={onAccept}
          className="auth-button"
          style={{ width: '100%', margin: 0, padding: '14px' }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
