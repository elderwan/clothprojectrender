#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib import error, parse, request


DEFAULT_HM_CATEGORY_URLS: dict[str, str] = {
    "women-accessories": "https://www2.hm.com/en_us/women/products/accessories.html",
    "women-coats": "https://www2.hm.com/en_us/women/products/jackets-coats/coats.html",
    "women-dresses": "https://www2.hm.com/en_us/women/products/dresses.html",
    "women-knitwear": "https://www2.hm.com/en_us/women/products/cardigans-sweaters.html",
    "women-shoes": "https://www2.hm.com/en_us/women/products/shoes.html",
    "women-tops": "https://www2.hm.com/en_us/women/products/tops.html",
    "women-trousers": "https://www2.hm.com/en_us/women/products/pants.html",
    "men-accessories": "https://www2.hm.com/en_us/men/products/accessories.html",
    "men-coats": "https://www2.hm.com/en_us/men/products/jackets-and-coats.html",
    "men-jeans": "https://www2.hm.com/en_us/men/products/jeans.html",
    "men-knitwear": "https://www2.hm.com/en_us/men/products/cardigans-sweaters.html",
    "men-shirts": "https://www2.hm.com/en_us/men/products/shirts.html",
    "men-shoes": "https://www2.hm.com/en_us/men/products/shoes.html",
    "men-tshirts": "https://www2.hm.com/en_us/men/products/t-shirts-and-tanks.html",
    "men-trousers": "https://www2.hm.com/en_us/men/products/pants.html",
    "kids-accessories": "https://www2.hm.com/en_us/kids/products/accessories.html",
    "kids-coats": "https://www2.hm.com/en_us/kids/products/outerwear.html",
    "kids-dresses": "https://www2.hm.com/en_us/kids/girls/clothing/dresses.html",
    "kids-shoes": "https://www2.hm.com/en_us/kids/products/shoes.html",
    "kids-tshirts": "https://www2.hm.com/en_us/kids/products/clothing/tops-t-shirts/t-shirts.html",
    "kids-tops": "https://www2.hm.com/en_us/kids/products/clothing/tops-t-shirts/shirts.html",
    "kids-trousers": "https://www2.hm.com/en_us/kids/products/clothing/pants.html",
}


def load_env_file(env_path: Path) -> None:
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'").strip('"')
        if key and key not in os_environ():
            os_environ()[key] = value


def os_environ() -> dict[str, str]:
    import os

    return os.environ


def log(message: str) -> None:
    print(message, flush=True)


def normalize_name(value: str) -> str:
    return " ".join(value.strip().lower().split())


def safe_float(value: Any) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        cleaned = value.replace("$", "").replace(",", "").strip()
        if not cleaned:
            return None
        try:
            return float(cleaned)
        except ValueError:
            return None
    return None


def unique_preserve_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            result.append(value)
    return result


def page_url(base_url: str, page_number: int) -> str:
    if page_number <= 1:
        return base_url
    separator = "&" if "?" in base_url else "?"
    return f"{base_url}{separator}page={page_number}"


def build_product_name(hit: dict[str, Any]) -> str:
    title = str(hit.get("title") or "").strip()
    color = str(((hit.get("productColor") or {}).get("colorName")) or "").strip()
    if title and color:
        return f"{title} - {color}"
    return title or f"H&M Product {hit.get('articleCode', '')}".strip()


def build_description(hit: dict[str, Any], category: dict[str, Any]) -> str:
    parts: list[str] = []
    title = str(hit.get("title") or "").strip()
    brand = str(hit.get("brandName") or "H&M").strip()
    color = str(((hit.get("productColor") or {}).get("colorName")) or "").strip()
    sizes = [
        str(size.get("name") or "").strip()
        for size in (hit.get("sizes") or [])
        if str(size.get("name") or "").strip()
    ]

    if title:
        parts.append(f"{brand} {title}.")
    if color:
        parts.append(f"Color: {color}.")
    if sizes:
        parts.append(f"Available sizes on H&M listing: {', '.join(unique_preserve_order(sizes))}.")
    parts.append(f"Imported from H&M {category['audience']} / {category['name']} listing page.")
    return " ".join(parts)


def build_composition_care(hit: dict[str, Any]) -> str:
    lines: list[str] = []
    article_code = str(hit.get("articleCode") or "").strip()
    listing_category = str(hit.get("category") or "").strip()
    regular_price = str(hit.get("regularPrice") or "").strip()

    if article_code:
        lines.append(f"H&M article code: {article_code}")
    if listing_category:
        lines.append(f"H&M listing category: {listing_category}")
    if regular_price:
        lines.append(f"H&M list price: {regular_price}")
    return "\n".join(lines)


@dataclass
class ImportCandidate:
    product_payload: dict[str, Any]
    image_urls: list[str]
    source_url: str
    category_slug: str


class SupabaseRestClient:
    def __init__(self, base_url: str, anon_key: str) -> None:
        self.base_url = base_url.rstrip("/")
        self.anon_key = anon_key
        self.default_headers = {
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}",
            "Content-Type": "application/json",
        }

    def _request(
        self,
        method: str,
        path: str,
        query: dict[str, str] | None = None,
        payload: Any | None = None,
        extra_headers: dict[str, str] | None = None,
    ) -> Any:
        url = f"{self.base_url}/rest/v1/{path.lstrip('/')}"
        if query:
            url = f"{url}?{parse.urlencode(query, doseq=True)}"

        headers = dict(self.default_headers)
        if extra_headers:
            headers.update(extra_headers)

        data = None
        if payload is not None:
            data = json.dumps(payload).encode("utf-8")

        req = request.Request(url, data=data, headers=headers, method=method)
        try:
            with request.urlopen(req, timeout=30) as response:
                body = response.read().decode("utf-8")
                if not body:
                    return None
                return json.loads(body)
        except error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="ignore")
            raise RuntimeError(f"Supabase {method} {url} failed: {exc.code} {body}") from exc

    def get_categories(self) -> list[dict[str, Any]]:
        rows = self._request(
            "GET",
            "categories",
            query={
                "select": "id,name,slug,audience,del_flg",
                "del_flg": "eq.false",
                "order": "audience.asc,name.asc",
            },
        )
        return rows or []

    def find_existing_product(self, name: str, category_id: str) -> dict[str, Any] | None:
        rows = self._request(
            "GET",
            "products",
            query={
                "select": "id,name,category_id",
                "name": f"eq.{name}",
                "category_id": f"eq.{category_id}",
                "del_flg": "eq.false",
                "limit": "1",
            },
        )
        return rows[0] if rows else None

    def get_existing_names_by_category(self, category_id: str) -> set[str]:
        rows = self._request(
            "GET",
            "products",
            query={
                "select": "name",
                "category_id": f"eq.{category_id}",
                "del_flg": "eq.false",
                "limit": "1000",
            },
        )
        return {normalize_name(str(row.get("name") or "")) for row in (rows or []) if str(row.get("name") or "").strip()}

    def get_all_existing_names(self) -> set[str]:
        rows = self._request(
            "GET",
            "products",
            query={
                "select": "name",
                "del_flg": "eq.false",
                "limit": "5000",
            },
        )
        return {normalize_name(str(row.get("name") or "")) for row in (rows or []) if str(row.get("name") or "").strip()}

    def insert_product(self, payload: dict[str, Any]) -> dict[str, Any]:
        rows = self._request(
            "POST",
            "products",
            payload=payload,
            extra_headers={"Prefer": "return=representation"},
        )
        if not rows:
            raise RuntimeError("Supabase product insert returned no rows.")
        return rows[0]

    def insert_product_images(self, rows: list[dict[str, Any]]) -> None:
        if not rows:
            return
        self._request(
            "POST",
            "product_images",
            payload=rows,
            extra_headers={"Prefer": "return=minimal"},
        )


class HmListingScraper:
    def __init__(self, headless: bool) -> None:
        self.headless = headless

    def _collect_hits(
        self,
        *,
        playwright: Any,
        category_slug: str,
        base_url: str,
        max_pages: int,
        max_products: int,
        headless: bool,
    ) -> list[dict[str, Any]]:
        browser = playwright.chromium.launch(headless=headless)
        context = browser.new_context(
            locale="en-US",
            timezone_id="America/New_York",
            viewport={"width": 1440, "height": 1024},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            ),
        )
        page = context.new_page()
        results: list[dict[str, Any]] = []
        seen_codes: set[str] = set()
        blocked = False

        try:
            for page_number in range(1, max_pages + 1):
                target_url = page_url(base_url, page_number)
                mode = "headless" if headless else "headed"
                log(f"[H&M] Fetching {category_slug} page {page_number} ({mode}): {target_url}")
                page.goto(target_url, wait_until="domcontentloaded", timeout=60000)

                title = page.title().strip().lower()
                if "access denied" in title:
                    blocked = True
                    break

                try:
                    page.locator("button:has-text('ACCEPT ALL')").click(timeout=3000)
                    page.wait_for_timeout(500)
                except Exception:
                    pass

                try:
                    page.wait_for_load_state("load", timeout=15000)
                except Exception:
                    pass
                page.wait_for_timeout(2500)
                raw_hits = page.evaluate(
                    "() => window.__NEXT_DATA__?.props?.pageProps?.plpProps?.productListingSectionProps?.productListingData?.hits || []"
                )

                if not raw_hits:
                    if "access denied" in page.locator("body").inner_text().lower():
                        blocked = True
                        break
                    log(f"[H&M] No listing data found for {target_url}")
                    continue

                for hit in raw_hits:
                    article_code = str(hit.get("articleCode") or "").strip()
                    if not article_code or article_code in seen_codes:
                        continue
                    seen_codes.add(article_code)
                    results.append(hit)
                    if len(results) >= max_products:
                        break

                if len(results) >= max_products:
                    break
        finally:
            context.close()
            browser.close()

        if blocked:
            raise RuntimeError("Blocked by H&M bot protection.")
        return results[:max_products]

    def scrape_listing_pages(
        self,
        category_slug: str,
        base_url: str,
        max_pages: int,
        max_products: int,
    ) -> list[dict[str, Any]]:
        try:
            from playwright.sync_api import sync_playwright
        except ImportError as exc:
            raise RuntimeError(
                "Playwright is not installed. Run: pip install -r scripts/requirements-hm-importer.txt "
                "and then python -m playwright install chromium"
            ) from exc

        with sync_playwright() as p:
            try:
                return self._collect_hits(
                    playwright=p,
                    category_slug=category_slug,
                    base_url=base_url,
                    max_pages=max_pages,
                    max_products=max_products,
                    headless=self.headless,
                )
            except RuntimeError as exc:
                if self.headless and "bot protection" in str(exc).lower():
                    log("[H&M] Headless mode was blocked. Retrying in a visible browser window.")
                    return self._collect_hits(
                        playwright=p,
                        category_slug=category_slug,
                        base_url=base_url,
                        max_pages=max_pages,
                        max_products=max_products,
                        headless=False,
                    )
                raise


def build_candidates(
    category: dict[str, Any],
    hits: list[dict[str, Any]],
    default_stock: int,
) -> list[ImportCandidate]:
    candidates: list[ImportCandidate] = []

    for hit in hits:
        title = build_product_name(hit)
        price = None
        if hit.get("prices"):
            price = safe_float((hit["prices"][0] or {}).get("price"))
        if price is None:
            price = safe_float(hit.get("regularPrice"))
        if price is None:
            continue

        image_urls = unique_preserve_order(
            [str(url).strip() for url in (hit.get("galleryImages") or []) if str(url).strip()]
        )
        if not image_urls:
            model_image = str(hit.get("imageModelSrc") or "").strip()
            product_image = str(hit.get("imageProductSrc") or "").strip()
            image_urls = unique_preserve_order([model_image, product_image])

        if not title or not image_urls:
            continue

        payload = {
            "name": title,
            "description": build_description(hit, category),
            "composition_care": build_composition_care(hit),
            "price": price,
            "category_id": category["id"],
            "stock_quantity": default_stock,
            "audience": category["audience"],
            "is_active": True,
            "del_flg": False,
        }

        pdp_url = str(hit.get("pdpUrl") or "").strip()
        if pdp_url.startswith("/"):
            pdp_url = f"https://www2.hm.com{pdp_url}"

        candidates.append(
            ImportCandidate(
                product_payload=payload,
                image_urls=image_urls,
                source_url=pdp_url,
                category_slug=str(category["slug"]),
            )
        )

    return candidates


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Import H&M listing products into this project's Supabase products tables."
    )
    parser.add_argument("--env-file", default=".env", help="Path to the env file containing Supabase credentials.")
    parser.add_argument(
        "--categories",
        default="",
        help="Comma-separated category slugs to import. Default: all categories that have a built-in H&M mapping.",
    )
    parser.add_argument(
        "--mapping-file",
        default="",
        help="Optional JSON file with slug->H&M listing URL overrides.",
    )
    parser.add_argument("--max-products-per-category", type=int, default=8, help="Maximum products to import per category.")
    parser.add_argument("--max-pages-per-category", type=int, default=2, help="Maximum H&M listing pages to scan.")
    parser.add_argument("--default-stock", type=int, default=25, help="Stock quantity to assign to imported products.")
    parser.add_argument("--dry-run", action="store_true", help="Preview imports without inserting into Supabase.")
    parser.add_argument("--headed", action="store_true", help="Run Chromium with a visible window.")
    parser.add_argument(
        "--allow-duplicates",
        action="store_true",
        help="Insert products even if the same name already exists under the same category.",
    )
    return parser.parse_args()


def load_mapping_file(mapping_file: str) -> dict[str, str]:
    if not mapping_file:
        return {}
    data = json.loads(Path(mapping_file).read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise RuntimeError("Mapping file must be a JSON object: {\"category-slug\": \"https://...\"}")
    return {str(key): str(value) for key, value in data.items()}


def main() -> int:
    args = parse_args()
    load_env_file(Path(args.env_file))

    env = os_environ()
    supabase_url = env.get("SUPABASE_URL", "").strip()
    supabase_anon_key = env.get("SUPABASE_ANON_KEY", "").strip()
    if not supabase_url or not supabase_anon_key:
        log("Missing SUPABASE_URL or SUPABASE_ANON_KEY.")
        return 1

    category_urls = dict(DEFAULT_HM_CATEGORY_URLS)
    category_urls.update(load_mapping_file(args.mapping_file))

    selected_slugs = {
        slug.strip()
        for slug in args.categories.split(",")
        if slug.strip()
    }

    supabase = SupabaseRestClient(supabase_url, supabase_anon_key)
    categories = supabase.get_categories()
    if selected_slugs:
        categories = [row for row in categories if row["slug"] in selected_slugs]
    else:
        categories = [row for row in categories if row["slug"] in category_urls]

    if not categories:
        log("No matching categories found.")
        return 1

    scraper = HmListingScraper(headless=not args.headed)
    all_existing_names = supabase.get_all_existing_names()

    inserted_count = 0
    skipped_count = 0
    failed_categories: list[str] = []

    for category in categories:
        slug = str(category["slug"])
        source_url = category_urls.get(slug)
        if not source_url:
            log(f"[SKIP] No H&M URL mapping for category slug: {slug}")
            skipped_count += 1
            continue

        try:
            hits = scraper.scrape_listing_pages(
                category_slug=slug,
                base_url=source_url,
                max_pages=args.max_pages_per_category,
                max_products=args.max_products_per_category,
            )
            candidates = build_candidates(category, hits, args.default_stock)
        except Exception as exc:
            failed_categories.append(slug)
            log(f"[FAIL] {slug}: {exc}")
            continue

        if not candidates:
            log(f"[WARN] No candidates generated for {slug}")
            continue

        existing_names = supabase.get_existing_names_by_category(str(category["id"]))

        for candidate in candidates:
            product_name = str(candidate.product_payload["name"])
            normalized_candidate_name = normalize_name(product_name)

            if not args.allow_duplicates:
                if normalized_candidate_name in existing_names or normalized_candidate_name in all_existing_names:
                    skipped_count += 1
                    log(f"[SKIP] Existing product: {product_name}")
                    continue

            if args.dry_run:
                log(
                    f"[DRY-RUN] {product_name} | ${candidate.product_payload['price']:.2f} | "
                    f"{candidate.category_slug} | images={len(candidate.image_urls)}"
                )
                continue

            try:
                inserted = supabase.insert_product(candidate.product_payload)
            except RuntimeError as exc:
                if "duplicate key value violates unique constraint" in str(exc).lower():
                    skipped_count += 1
                    existing_names.add(normalized_candidate_name)
                    all_existing_names.add(normalized_candidate_name)
                    log(f"[SKIP] Unique constraint prevented duplicate insert: {product_name}")
                    continue
                raise
            image_rows = [
                {
                    "product_id": inserted["id"],
                    "url": image_url,
                    "sort_order": index,
                    "is_primary": index == 0,
                    "del_flg": False,
                }
                for index, image_url in enumerate(candidate.image_urls)
            ]
            supabase.insert_product_images(image_rows)
            inserted_count += 1
            existing_names.add(normalized_candidate_name)
            all_existing_names.add(normalized_candidate_name)
            time.sleep(0.2)
            log(f"[INSERTED] {product_name}")

    log("")
    log("Import summary")
    log(f"- Categories processed: {len(categories)}")
    log(f"- Products inserted: {inserted_count}")
    log(f"- Products skipped: {skipped_count}")
    log(f"- Failed categories: {', '.join(failed_categories) if failed_categories else 'none'}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
