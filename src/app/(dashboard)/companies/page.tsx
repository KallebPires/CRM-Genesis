import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CompanyFormDialog } from "@/components/companies/company-form-dialog";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/delete-button";
import { deleteCompanyAction } from "@/server/companies";

export default async function CompaniesPage() {
  const { organizationId } = await requireSession();

  const companies = await db.company.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { contacts: true, deals: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empresas"
        description={`${companies.length} ${companies.length === 1 ? "empresa" : "empresas"}`}
        action={<CompanyFormDialog />}
      />

      <Card>
        <CardHeader className="sr-only">
          <CardTitle>Lista de empresas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Contatos</TableHead>
                <TableHead>Negócios</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>
                    {company.website ? (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline underline-offset-4"
                      >
                        {company.website}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{company._count.contacts}</TableCell>
                  <TableCell>{company._count.deals}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <CompanyFormDialog company={company} />
                      <DeleteButton
                        action={deleteCompanyAction.bind(null, company.id)}
                        confirmMessage={`Excluir a empresa "${company.name}"?`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma empresa cadastrada ainda.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
