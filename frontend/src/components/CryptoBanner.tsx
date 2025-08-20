import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export type Ticker = {
  symbol: string;
  price: number;
  change24h: number;
  prices24h?: number[];
  icon?: React.ReactNode;
};

export type CryptoBannerProps = {
  tickers?: Ticker[];
  className?: string;
  heightPx?: number;
  onClickTicker?: (symbol: string) => void;
};

function clsx(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(' ');
}

function toSparkPath(values: number[], width = 120, height = 30) {
  if (!values || values.length < 2) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = width / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / span) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  return `M ${points[0]} L ${points.slice(1).join(' ')}`;
}

function TickerPill({
  t,
  onClick,
}: {
  t: Ticker;
  onClick?: (s: string) => void;
}) {
  const positive = t.change24h >= 0;
  const color = positive ? 'text-emerald-400' : 'text-rose-400';
  const bg = positive ? 'bg-emerald-400/10' : 'bg-rose-400/10';
  return (
    <button
      onClick={() => onClick?.(t.symbol)}
      className={clsx(
        'group flex items-center gap-3 rounded-xl px-4 py-2 backdrop-blur-md',
        'ring-1 ring-white/10 hover:ring-white/20 transition-colors',
        bg
      )}
      aria-label={`Open ${t.symbol} trading`}
    >
      <div className="flex items-center gap-2 min-w-[88px]">
        {t.icon && <span className="shrink-0">{t.icon}</span>}
        <span className="font-medium tracking-tight text-white/90">
          {t.symbol}
        </span>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="tabular-nums font-semibold text-white">
          {t.price.toLocaleString()}
        </span>
        <span className={clsx('tabular-nums text-sm', color)}>
          {positive ? '+' : ''}
          {t.change24h.toFixed(2)}%
        </span>
      </div>
      <svg width={120} height={30} className="ml-3 hidden sm:block">
        <path
          d={toSparkPath(t.prices24h ?? [], 120, 30)}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className={clsx(positive ? 'text-emerald-300' : 'text-rose-300')}
        />
      </svg>
    </button>
  );
}

// Static demo tickers
const defaultTickers: Ticker[] = [
  {
    symbol: 'BTC/USD',
    price: 48250,
    change24h: -0.56,
    prices24h: [48500, 48350, 48200, 48250],
  },
  {
    symbol: 'ETH/USD',
    price: 3120.75,
    change24h: 1.12,
    prices24h: [3050, 3080, 3110, 3120],
  },
  {
    symbol: 'SOL/USD',
    price: 145.2,
    change24h: -0.95,
    prices24h: [150, 148, 146, 145.2],
  },
  {
    symbol: 'BNB/USD',
    price: 575.9,
    change24h: 0.48,
    prices24h: [570, 572, 574, 575.9],
  },
];

export default function CryptoBanner({
  tickers = defaultTickers,
  className,
  heightPx,
  onClickTicker,
}: CryptoBannerProps) {
  const row = (
    <div className="flex items-center gap-4 pr-4">
      {tickers.map((t, i) => (
        <TickerPill key={`${t.symbol}-${i}`} t={t} onClick={onClickTicker} />
      ))}
    </div>
  );

  return (
    <section
      className={clsx(
        'relative w-full overflow-hidden shadow-xl',
        'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900',
        'text-white',
        heightPx ? '' : 'h-24 md:h-28 2xl:h-32',
        className
      )}
      style={heightPx ? { height: heightPx } : undefined}
    >
      <motion.div
        aria-hidden
        className="absolute -inset-x-1/3 top-0 bottom-0 opacity-20 blur-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500"
        initial={{ x: '-30%' }}
        animate={{ x: '30%' }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
      />

      <div className="relative z-10 h-full  flex flex-col justify-center">
        {/* Header: label + demo badge + CTA */}
        <div className="flex items-center justify-between gap-4 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <h2 className="text-base md:text-lg font-semibold tracking-tight text-white/90">
              Markets
            </h2>
            <span className="inline-flex items-center gap-1 text-xs md:text-sm text-emerald-300/90">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Demo Prices • Static
            </span>
          </div>
          <Link
            to="/trade"
            className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-white/15 hover:ring-white/25 backdrop-blur-md bg-white/5"
          >
            Trade now
          </Link>
        </div>
        <div className="relative mt-2 overflow-hidden">
          <motion.div
            className="flex"
            initial={{ x: 0 }}
            animate={{ x: '-50%' }}
            transition={{ duration: 22, ease: 'linear', repeat: Infinity }}
            style={{ width: '200%' }}
          >
            <div className="w-1/2 flex items-center gap-4">
              {row}
              {row}
            </div>
            <div className="w-1/2 flex items-center gap-4">
              {row}
              {row}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
