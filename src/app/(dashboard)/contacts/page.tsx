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
import { Badge } from "@/components/ui/badge";
import { ContactFormDialog } from "@/components/contacts/contact-form-dialog";
import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/delete-button";
import { deleteContactAction } from "@/server/contacts";

export default async function ContactsPage() {
  const { organizationId } = await requireSession();

  const [contacts, companies] = await Promise.all([
    db.contact.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      include: { company: { select: { id: true, name: true } } },
    }),
    db.company.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contatos"
        description={`${contacts.length} ${contacts.length === 1 ? "contato" : "contatos"}`}
        action={<ContactFormDialog companies={companies} />}
      />

      <Card>
        <CardHeader className="sr-only">
          <CardTitle>Lista de contatos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>
                    {contact.company?.name ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>{contact.email ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell>
                    {contact.source ? <Badge variant="secondary">{contact.source}</Badge> : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <ContactFormDialog
                        companies={companies}
                        contact={{
                          id: contact.id,
                          name: contact.name,
                          email: contact.email,
                          phone: contact.phone,
                          role: contact.role,
                          source: contact.source,
                          companyId: contact.companyId,
                        }}
                      />
                      <DeleteButton
                        action={deleteContactAction.bind(null, contact.id)}
                        confirmMessage={`Excluir o contato "${contact.name}"?`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum contato cadastrado ainda.
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
