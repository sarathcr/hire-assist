import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface IpVerificationResult {
  ip: string;
  isSeidorOpentrends: boolean;
  orgName?: string;
  statusLabel: string;
  isVerified: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class IpVerificationService {
  // Configurable Seidor Opentrends IP ranges/subnets and office IP patterns
  private allowedIpRanges: string[] = [
    '127.0.0.1',
    '::1',
    '10.',
    '172.16.',
    '172.17.',
    '172.18.',
    '172.19.',
    '172.20.',
    '172.21.',
    '172.22.',
    '172.23.',
    '172.24.',
    '172.25.',
    '172.26.',
    '172.27.',
    '172.28.',
    '172.29.',
    '172.30.',
    '172.31.',
    '192.168.',
    'localhost',
    '202.88.251.', // Seidor Opentrends Office Public IP range
  ];

  // Configurable keywords for Seidor Opentrends ISP/Org matching
  private seidorKeywords: string[] = [
    'seidor',
    'opentrends',
    'seidor opentrends',
    'opentrends india',
    'seidor india',
  ];

  constructor(private http: HttpClient) {}

  /**
   * Synchronously checks whether an IP address matches known Seidor Opentrends IP subnets/ranges or local dev IPs
   */
  public isSeidorOpentrendsIpPattern(ip: string): boolean {
    if (!ip) return false;
    const trimmedIp = ip.trim().toLowerCase();
    
    // Check direct range/prefix match
    const isMatched = this.allowedIpRanges.some((prefix) => trimmedIp.startsWith(prefix) || trimmedIp === prefix);
    if (isMatched) return true;

    // Check if stored verification cache marks it as verified
    const storedStatus = localStorage.getItem(`ip_verified_${trimmedIp}`);
    if (storedStatus === 'true') return true;

    return false;
  }

  /**
   * Asynchronously verifies IP against IP details lookup API (checking ISP / Organization metadata)
   */
  public verifyIpAddress(ip: string): Observable<IpVerificationResult> {
    if (!ip) {
      return of({
        ip: '',
        isSeidorOpentrends: false,
        statusLabel: 'Unknown Device IP',
        isVerified: false,
      });
    }

    const trimmedIp = ip.trim();

    // Local / private IP ranges are recognized as internal Seidor Opentrends office network devices
    if (this.isSeidorOpentrendsIpPattern(trimmedIp)) {
      localStorage.setItem(`ip_verified_${trimmedIp}`, 'true');
      return of({
        ip: trimmedIp,
        isSeidorOpentrends: true,
        orgName: 'Seidor Opentrends Internal Network',
        statusLabel: 'Seidor Opentrends Device',
        isVerified: true,
      });
    }

    // Perform external lookup via ipapi.co to verify ISP / Org name
    return this.http.get<any>(`https://ipapi.co/${trimmedIp}/json/`).pipe(
      map((res) => {
        const org = (res?.org || res?.asn || res?.company || '').toLowerCase();
        const isSeidorOrg = this.seidorKeywords.some((kw) => org.includes(kw));

        const isVerified = isSeidorOrg;
        localStorage.setItem(`ip_verified_${trimmedIp}`, isVerified ? 'true' : 'false');

        return {
          ip: trimmedIp,
          isSeidorOpentrends: isVerified,
          orgName: res?.org || 'External Provider',
          statusLabel: isVerified ? 'Seidor Opentrends Device' : 'External Device IP',
          isVerified,
        };
      }),
      catchError(() => {
        // Fallback: If external lookup fails, check pattern
        const isVerified = this.isSeidorOpentrendsIpPattern(trimmedIp);
        return of({
          ip: trimmedIp,
          isSeidorOpentrends: isVerified,
          statusLabel: isVerified ? 'Seidor Opentrends Device' : 'Unverified Device IP',
          isVerified,
        });
      })
    );
  }

  /**
   * Helper to get verification tag details (label, severity, icon) for UI display
   */
  public getIpVerificationMeta(
    ip: string | null | undefined,
    isIpValidated?: boolean | null,
    ipValidationStatus?: string | null
  ): {
    ip: string;
    isVerified: boolean;
    label: string;
    severity: 'success' | 'warn' | 'info' | 'danger';
    icon: string;
  } {
    if (!ip || ip.trim().toLowerCase() === 'null' || ip.trim().toLowerCase() === 'undefined') {
      return {
        ip: 'N/A',
        isVerified: false,
        label: 'No IP Recorded',
        severity: 'info',
        icon: 'pi pi-question-circle',
      };
    }

    // 1. If backend provided validated status, use it as primary truth
    if (isIpValidated !== undefined && isIpValidated !== null) {
      if (isIpValidated) {
        return {
          ip,
          isVerified: true,
          label: ipValidationStatus || 'Authorized Device',
          severity: 'success',
          icon: 'pi pi-verified',
        };
      } else {
        const statusLower = (ipValidationStatus || '').toLowerCase();
        const isSuspicious = statusLower.includes('suspicious') || statusLower.includes('multiple') || statusLower.includes('mismatch') || statusLower.includes('invalid');
        return {
          ip,
          isVerified: false,
          label: ipValidationStatus || 'Unauthorized Network',
          severity: isSuspicious ? 'danger' : 'warn',
          icon: 'pi pi-exclamation-triangle',
        };
      }
    }

    // 2. Fallback to pattern check if backend status was not sent
    const isVerified = this.isSeidorOpentrendsIpPattern(ip);

    if (isVerified) {
      return {
        ip,
        isVerified: true,
        label: 'Authorized Device',
        severity: 'success',
        icon: 'pi pi-verified',
      };
    }

    return {
      ip,
      isVerified: false,
      label: 'Unauthorized Network',
      severity: 'warn',
      icon: 'pi pi-exclamation-triangle',
    };
  }
}
